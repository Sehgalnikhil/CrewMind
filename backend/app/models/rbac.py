from typing import TYPE_CHECKING
from sqlalchemy import Boolean, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import IdMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.tenant import Organization, Workspace


class Role(Base, IdMixin, TimestampMixin):
    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False)

    role_permissions: Mapped[list["RolePermission"]] = relationship(
        back_populates="role", cascade="all, delete-orphan"
    )
    members: Mapped[list["OrganizationMember"]] = relationship(
        back_populates="role"
    )


class Permission(Base, IdMixin, TimestampMixin):
    __tablename__ = "permissions"

    name: Mapped[str] = mapped_column(String(255), unique=True, index=True) # e.g. "documents.read"

    role_permissions: Mapped[list["RolePermission"]] = relationship(
        back_populates="permission", cascade="all, delete-orphan"
    )


class RolePermission(Base, IdMixin, TimestampMixin):
    __tablename__ = "role_permissions"
    __table_args__ = (UniqueConstraint('role_id', 'permission_id', name='uq_role_permission'),)

    role_id: Mapped[str] = mapped_column(ForeignKey("roles.id"), index=True)
    permission_id: Mapped[str] = mapped_column(ForeignKey("permissions.id"), index=True)

    role: Mapped["Role"] = relationship(back_populates="role_permissions")
    permission: Mapped["Permission"] = relationship(back_populates="role_permissions")


class OrganizationMember(Base, IdMixin, TimestampMixin):
    __tablename__ = "organization_members"
    __table_args__ = (UniqueConstraint('user_id', 'workspace_id', name='uq_user_workspace'),)

    org_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), index=True)
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    role_id: Mapped[str] = mapped_column(ForeignKey("roles.id"), index=True)

    organization: Mapped["Organization"] = relationship(back_populates="members")
    workspace: Mapped["Workspace"] = relationship(back_populates="members")
    user: Mapped["User"] = relationship(back_populates="memberships")
    role: Mapped["Role"] = relationship(back_populates="members")
