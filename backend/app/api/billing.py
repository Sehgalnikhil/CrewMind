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
from app.models.tenant import Subscription, Workspace
from app.models.rbac import OrganizationMember
from app.models.user import User
from app.models.usage import WorkspaceUsage
from app.core.billing_catalog import get_plan, get_addon

router = APIRouter(prefix="/api/billing", tags=["billing"])
settings = get_settings()

rzp_client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))


class CreateOrderRequest(BaseModel):
    plan_name: str
    is_annual: bool = False
    addon_id: str | None = None


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

    amount = 0
    plan_id = "order_based"
    
    if req.addon_id:
        addon = get_addon(req.addon_id)
        if not addon:
            raise HTTPException(status_code=404, detail="Add-on not found")
        amount = addon.price
        plan_id = f"addon_{req.addon_id}"
    else:
        plan = get_plan(req.plan_name)
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        amount = plan.annual_price if req.is_annual else plan.monthly_price
        plan_id = plan.id

    if amount < 100 and plan_id != "starter":
        raise HTTPException(status_code=400, detail="Amount must be at least 100 paise")

    try:
        order_id = "free_plan"
        if amount >= 100:
            rzp_order = rzp_client.order.create({
                "amount": amount,
                "currency": "INR",
                "receipt": f"rcpt_{workspace_id}"[:40]
            })
            order_id = rzp_order["id"]

        subscription = Subscription(
            workspace_id=workspace_id,
            plan_name=req.plan_name,
            status="active" if amount == 0 else "created",
            billing_cycle="annual" if req.is_annual else "monthly",
            plan_price=amount,
            razorpay_subscription_id=order_id if amount > 0 else None,
            razorpay_plan_id=plan_id,
        )
        db.add(subscription)
        await db.commit()

        await log_audit_event(
            db, workspace_id=workspace_id, user_id=ctx.user.id,
            action="billing.order_created",
            resource_type="subscription", resource_id=subscription.id,
            details={"plan": req.plan_name},
        )
        return {"order_id": order_id, "key_id": settings.razorpay_key_id, "amount": amount}
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


@router.get("/usage")
async def get_usage(
    ctx: RequestContext = Depends(RequiresPermission("billing.view")),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    workspace_id = ctx.workspace.id if ctx.workspace else None
    if not workspace_id:
        raise HTTPException(status_code=400, detail="Workspace required")

    # Get active subscription
    result = await db.execute(
        select(Subscription).where(
            Subscription.workspace_id == workspace_id,
            Subscription.status == "active"
        ).order_by(Subscription.created_at.desc())
    )
    subscription = result.scalars().first()
    plan_name = subscription.plan_name if subscription else "starter"
    plan = get_plan(plan_name) or get_plan("starter")
    
    # Get usage
    result = await db.execute(
        select(WorkspaceUsage).where(WorkspaceUsage.workspace_id == workspace_id)
    )
    usage = result.scalar_one_or_none()
    
    # Get members
    result = await db.execute(
        select(OrganizationMember).where(OrganizationMember.workspace_id == workspace_id)
    )
    members = result.scalars().all()
    member_count = len(members)

    ai_used = usage.ai_requests_used if usage else 0
    storage_used = usage.storage_bytes_used if usage else 0
    credits_available = plan.limits.included_ai_credits + (usage.additional_ai_credits if usage else 0)

    # Convert bytes to GB for display simplicity in frontend
    storage_gb = storage_used / (1024 * 1024 * 1024)
    storage_limit_gb = plan.limits.max_storage_bytes / (1024 * 1024 * 1024)

    return {
        "plan": {
            "name": plan.name,
            "billing_cycle": subscription.billing_cycle if subscription else "monthly",
            "status": subscription.status if subscription else "active"
        },
        "usage": [
            {"label": "AI Requests Used", "used": ai_used, "limit": credits_available, "color": "#8A7BEF", "unit": ""},
            {"label": "Active AI Executives", "used": 5, "limit": 5, "color": "#059669", "unit": ""},
            {"label": "Memory Storage", "used": round(storage_gb, 2), "limit": round(storage_limit_gb, 2), "color": "#D97706", "unit": "GB"},
            {"label": "Team Members", "used": member_count, "limit": plan.limits.max_users, "color": "#f43f5e", "unit": ""},
            {"label": "Workspaces", "used": 1, "limit": plan.limits.max_workspaces, "color": "#8b5cf6", "unit": ""},
        ]
    }
