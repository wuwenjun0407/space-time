"""create all tables

Revision ID: 0001
Revises:
Create Date: 2026-05-28
"""
from alembic import op

from app.core.database import Base
import app.models  # noqa: F401

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    bind.exec_driver_sql('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    Base.metadata.drop_all(bind=op.get_bind())
