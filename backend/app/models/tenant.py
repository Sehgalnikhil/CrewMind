from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import IdMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.rbac import OrganizationMember

class Organization(Base, IdMixin, TimestampMixin):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(255))
    branding: Mapped[str | None] = mapped_column(Text, nullable=True) # JSON or config string
    settings: Mapped[str | None] = mapped_column(Text, nullable=True) # JSON settings

    workspaces: Mapped[list["Workspace"]] = relationship(
        back_populates="organization", cascade="all, delete-orphan"
    )
    members: Mapped[list["OrganizationMember"]] = relationship(
        back_populates="organization", cascade="all, delete-orphan"
    )


class Workspace(Base, IdMixin, TimestampMixin):
    __tablename__ = "workspaces"

    org_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    settings: Mapped[str | None] = mapped_column(Text, nullable=True)

    organization: Mapped["Organization"] = relationship(back_populates="workspaces")
    projects: Mapped[list["Project"]] = relationship(
        back_populates="workspace", cascade="all, delete-orphan"
    )
    members: Mapped[list["OrganizationMember"]] = relationship(
        back_populates="workspace", cascade="all, delete-orphan"
    )
    features: Mapped[list["WorkspaceFeature"]] = relationship(
        back_populates="workspace", cascade="all, delete-orphan"
    )
    subscriptions: Mapped[list["Subscription"]] = relationship(
        back_populates="workspace", cascade="all, delete-orphan"
    )


class WorkspaceFeature(Base, IdMixin, TimestampMixin):
    __tablename__ = "workspace_features"

    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), index=True)
    feature_name: Mapped[str] = mapped_column(String(100), index=True)
    enabled: Mapped[bool] = mapped_column(default=True)
    
    workspace: Mapped["Workspace"] = relationship(back_populates="features")


class Subscription(Base, IdMixin, TimestampMixin):
    __tablename__ = "subscriptions"

    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), index=True)
    plan_name: Mapped[str] = mapped_column(String(100)) # e.g. "free", "pro", "enterprise"
    status: Mapped[str] = mapped_column(String(50), default="active") # active | canceled | past_due
    razorpay_subscription_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    razorpay_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    razorpay_plan_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    workspace: Mapped["Workspace"] = relationship(back_populates="subscriptions")


class Project(Base, IdMixin, TimestampMixin):
    __tablename__ = "projects"

    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    workspace: Mapped["Workspace"] = relationship(back_populates="projects")
