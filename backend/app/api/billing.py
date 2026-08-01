import hashlib
import hmac

import razorpay
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import RequestContext, RequiresPermission, get_current_user
from app.core.audit import log_audit_event
from app.core.config import get_settings
from app.core.database import get_db
from app.models.tenant import Subscription
from app.models.user import User

router = APIRouter(prefix="/api/billing", tags=["billing"])
settings = get_settings()

rzp_client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))


class CreateOrderRequest(BaseModel):
    plan_name: str


class VerifyPaymentRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str


@router.post("/create-order")
async def create_order(
    req: CreateOrderRequest,
    ctx: RequestContext = Depends(RequiresPermission("billing.manage")),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    workspace_id = ctx.workspace.id if ctx.workspace else None
    if not workspace_id:
        raise HTTPException(status_code=400, detail="Workspace required")

    amount_map = {
        "Founder": 149900,
        "Growth": 499900,
        "Enterprise": 999900
    }
    amount = amount_map.get(req.plan_name, 149900)
    if amount < 100:
        raise HTTPException(status_code=400, detail="Amount must be at least 100 paise")

    try:
        rzp_order = rzp_client.order.create({
            "amount": amount,
            "currency": "INR",
            "receipt": f"rcpt_{workspace_id}"[:40]
        })

        subscription = Subscription(
            workspace_id=workspace_id,
            plan_name=req.plan_name,
            status="created",
            razorpay_subscription_id=rzp_order["id"],
            razorpay_plan_id="order_based",
        )
        db.add(subscription)
        await db.commit()

        await log_audit_event(
            db, workspace_id=workspace_id, user_id=ctx.user.id,
            action="billing.order_created",
            resource_type="subscription", resource_id=subscription.id,
            details={"plan": req.plan_name},
        )
        return {"order_id": rzp_order["id"], "key_id": settings.razorpay_key_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Order creation failed: {str(e)}")


@router.post("/verify")
async def verify_payment(
    req: VerifyPaymentRequest,
    ctx: RequestContext = Depends(RequiresPermission("billing.manage")),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    workspace_id = ctx.workspace.id if ctx.workspace else None
    if not workspace_id:
        raise HTTPException(status_code=400, detail="Workspace required")

    try:
        expected_signature = hmac.new(
            bytes(settings.razorpay_key_secret, "latin-1"),
            bytes(req.razorpay_order_id + "|" + req.razorpay_payment_id, "latin-1"),
            hashlib.sha256,
        ).hexdigest()

        if expected_signature != req.razorpay_signature:
            raise HTTPException(status_code=400, detail="Invalid signature")

        result = await db.execute(
            select(Subscription).where(Subscription.razorpay_subscription_id == req.razorpay_order_id)
        )
        subscription = result.scalar_one_or_none()

        if subscription:
            subscription.status = "active"
            await db.commit()
            await log_audit_event(
                db, workspace_id=workspace_id, user_id=ctx.user.id,
                action="billing.subscription_activated",
                resource_type="subscription", resource_id=subscription.id,
                details={"plan": subscription.plan_name},
            )

        return {"status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        return {"status": "failed", "detail": str(e)}


@router.post("/webhook")
async def razorpay_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    signature = request.headers.get("x-razorpay-signature")

    try:
        if signature:
            rzp_client.utility.verify_webhook_signature(
                payload.decode("utf-8"), signature, settings.razorpay_key_secret
            )
    except Exception:
        pass

    event = await request.json()
    if event.get("event") == "subscription.charged":
        sub_id = event["payload"]["subscription"]["entity"]["id"]
        result = await db.execute(select(Subscription).where(Subscription.razorpay_subscription_id == sub_id))
        subscription = result.scalar_one_or_none()
        if subscription:
            subscription.status = "active"
            await db.commit()
    elif event.get("event") == "subscription.cancelled":
        sub_id = event["payload"]["subscription"]["entity"]["id"]
        result = await db.execute(select(Subscription).where(Subscription.razorpay_subscription_id == sub_id))
        subscription = result.scalar_one_or_none()
        if subscription:
            subscription.status = "canceled"
            await db.commit()

    return {"status": "ok"}
