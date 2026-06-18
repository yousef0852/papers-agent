"""add waitlist table

Revision ID: a1b2c3d4e5f6
Revises: ec45b9b43a8c
Create Date: 2026-06-18 08:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'ec45b9b43a8c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'waitlist',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('source', sa.String(), server_default='waitlist', nullable=False),
        sa.Column('note', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_waitlist_email', 'waitlist', ['email'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_waitlist_email', table_name='waitlist')
    op.drop_table('waitlist')
