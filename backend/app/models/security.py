from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import IdMixin, TimestampMixin


class RefreshToken(Base, IdMixin, TimestampMixin):
    __tablename__ = "refresh_tokens"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("user_sessions.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(255))
    
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class UserSession(Base, IdMixin, TimestampMixin):
    __tablename__ = "user_sessions"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    device_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    device_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    browser: Mapped[str | None] = mapped_column(String(100), nullable=True)
    os: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    last_active_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active") # active, revoked, expired


class UserSecurity(Base, IdMixin, TimestampMixin):
    __tablename__ = "user_security"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    totp_secret: Mapped[str | None] = mapped_column(String(255), nullable=True)
    backup_codes: Mapped[str | None] = mapped_column(Text, nullable=True) # hashed JSON array of strings
    
    failed_login_attempts: Mapped[int] = mapped_column(default=0)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_password_change: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class OAuthProvider(Base, IdMixin, TimestampMixin):
    __tablename__ = "oauth_providers"

    provider_name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    client_id: Mapped[str] = mapped_column(String(255))
    client_secret: Mapped[str] = mapped_column(Text) # Ensure encrypted or hashed securely
    configuration: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)


class OrganizationDomain(Base, IdMixin, TimestampMixin):
    __tablename__ = "organization_domains"

    organization_id: Mapped[str] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), index=True)
    domain: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    
    verification_token: Mapped[str] = mapped_column(String(255))
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class WorkspaceInvitation(Base, IdMixin, TimestampMixin):
    __tablename__ = "workspace_invitations"

    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), index=True)
    email: Mapped[str] = mapped_column(String(255), index=True)
    role_id: Mapped[str] = mapped_column(ForeignKey("roles.id", ondelete="CASCADE"))
    invited_by: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    
    token_hash: Mapped[str] = mapped_column(String(255), unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class APIKey(Base, IdMixin, TimestampMixin):
    __tablename__ = "api_keys"

    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), index=True)
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    name: Mapped[str] = mapped_column(String(255))
    key_hash: Mapped[str] = mapped_column(String(255), unique=True)
    permissions: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
