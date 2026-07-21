from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import IdMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class Organization(Base, IdMixin, TimestampMixin):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(255))
    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)

    owner: Mapped["User"] = relationship(back_populates="organizations")
