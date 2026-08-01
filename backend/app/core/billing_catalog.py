from typing import Any, Dict, List, Optional
from pydantic import BaseModel

class PlanLimit(BaseModel):
    max_workspaces: int
    max_users: int
    max_storage_bytes: int
    included_ai_credits: int
    max_documents: int

class PlanConfig(BaseModel):
    id: str
    name: str
    monthly_price: int  # in paise
    annual_price: int   # in paise
    limits: PlanLimit
    features: List[str]
    is_custom: bool = False

class AddonConfig(BaseModel):
    id: str
    name: str
    price: int # in paise
    description: str

PLANS: Dict[str, PlanConfig] = {
    "starter": PlanConfig(
        id="starter",
        name="Starter",
        monthly_price=0,
        annual_price=0,
        limits=PlanLimit(
            max_workspaces=1,
            max_users=1,
            max_storage_bytes=1 * 1024 * 1024 * 1024, # 1 GB
            included_ai_credits=500,
            max_documents=20,
        ),
        features=["chat", "basic_memory"]
    ),
    "founder": PlanConfig(
        id="founder",
        name="Founder",
        monthly_price=299900,
        annual_price=239900, # ~20% off
        limits=PlanLimit(
            max_workspaces=2,
            max_users=5,
            max_storage_bytes=10 * 1024 * 1024 * 1024, # 10 GB
            included_ai_credits=2500,
            max_documents=250,
        ),
        features=["chat", "basic_memory", "reports", "knowledge_graph"]
    ),
    "growth": PlanConfig(
        id="growth",
        name="Growth",
        monthly_price=999900,
        annual_price=799900,
        limits=PlanLimit(
            max_workspaces=5,
            max_users=25,
            max_storage_bytes=50 * 1024 * 1024 * 1024, # 50 GB
            included_ai_credits=10000,
            max_documents=1000,
        ),
        features=["chat", "basic_memory", "reports", "knowledge_graph", "war_room", "digital_twin", "simulator"]
    ),
    "business": PlanConfig(
        id="business",
        name="Business",
        monthly_price=2499900,
        annual_price=1999900,
        limits=PlanLimit(
            max_workspaces=20,
            max_users=100,
            max_storage_bytes=250 * 1024 * 1024 * 1024, # 250 GB
            included_ai_credits=50000,
            max_documents=5000,
        ),
        features=["chat", "basic_memory", "reports", "knowledge_graph", "war_room", "digital_twin", "simulator", "advanced_rbac", "api_access", "audit_logs"]
    ),
    "enterprise": PlanConfig(
        id="enterprise",
        name="Enterprise",
        monthly_price=0,
        annual_price=0,
        is_custom=True,
        limits=PlanLimit(
            max_workspaces=9999,
            max_users=9999,
            max_storage_bytes=10 * 1024 * 1024 * 1024 * 1024, # 10 TB
            included_ai_credits=1000000,
            max_documents=100000,
        ),
        features=["chat", "basic_memory", "reports", "knowledge_graph", "war_room", "digital_twin", "simulator", "advanced_rbac", "api_access", "audit_logs", "sso", "dedicated_support"]
    )
}

ADDONS: Dict[str, AddonConfig] = {
    "extra_credits_small": AddonConfig(
        id="extra_credits_small",
        name="1,000 AI Credits",
        price=49900,
        description="Top up your monthly AI allowance."
    ),
    "extra_credits_medium": AddonConfig(
        id="extra_credits_medium",
        name="5,000 AI Credits",
        price=199900,
        description="Top up your monthly AI allowance."
    ),
    "extra_credits_large": AddonConfig(
        id="extra_credits_large",
        name="20,000 AI Credits",
        price=599900,
        description="Top up your monthly AI allowance."
    ),
}

def get_plan(plan_name: str) -> Optional[PlanConfig]:
    if not plan_name:
        return None
    key = plan_name.lower().strip()
    return PLANS.get(key)

def get_addon(addon_id: str) -> Optional[AddonConfig]:
    return ADDONS.get(addon_id)
