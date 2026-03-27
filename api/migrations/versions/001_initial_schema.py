"""Initial schema setup for cnc-mayyanks-api

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-03-27 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create organizations table
    op.create_table(
        'organizations',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('slug', sa.String(length=100), nullable=False),
        sa.Column('plan', sa.String(length=50), nullable=False, server_default='starter'),
        sa.Column('max_machines', sa.Integer(), nullable=False, server_default='10'),
        sa.Column('settings', postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug', name='uq_org_slug')
    )

    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=True),
        sa.Column('role', sa.Enum('ADMIN', 'OPERATOR', 'VIEWER', 'API_KEY', name='userrole'), nullable=False, server_default='OPERATOR'),
        sa.Column('org_id', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email', name='uq_user_email')
    )
    op.create_index('ix_users_org_email', 'users', ['org_id', 'email'])

    # Create machines table
    op.create_table(
        'machines',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('model', sa.String(length=255), nullable=True),
        sa.Column('manufacturer', sa.String(length=255), nullable=True),
        sa.Column('serial_number', sa.String(length=100), nullable=True),
        sa.Column('org_id', sa.String(), nullable=False),
        sa.Column('status', sa.Enum('ONLINE', 'OFFLINE', 'RUNNING', 'IDLE', 'MAINTENANCE', 'ERROR', name='machinestatus'), nullable=False, server_default='OFFLINE'),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('protocol', sa.String(length=50), nullable=False, server_default='mqtt'),
        sa.Column('connection_config', postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('last_heartbeat', sa.DateTime(timezone=True), nullable=True),
        sa.Column('installed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('org_id', 'serial_number', name='uq_machine_serial')
    )
    op.create_index('ix_machines_org_status', 'machines', ['org_id', 'status'])

    # Create telemetry table (TimescaleDB hypertable)
    op.create_table(
        'telemetry',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('machine_id', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('spindle_speed', sa.Float(), nullable=True),
        sa.Column('feed_rate', sa.Float(), nullable=True),
        sa.Column('temperature', sa.Float(), nullable=True),
        sa.Column('vibration', sa.Float(), nullable=True),
        sa.Column('load_percent', sa.Float(), nullable=True),
        sa.Column('power_consumption', sa.Float(), nullable=True),
        sa.Column('tool_id', sa.String(length=50), nullable=True),
        sa.Column('tool_wear', sa.Float(), nullable=True),
        sa.Column('coolant_flow', sa.Float(), nullable=True),
        sa.Column('coolant_temp', sa.Float(), nullable=True),
        sa.Column('axis_positions', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('raw_data', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['machine_id'], ['machines.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_telemetry_machine_time', 'telemetry', ['machine_id', 'timestamp'])

    # Create alerts table
    op.create_table(
        'alerts',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('machine_id', sa.String(), nullable=False),
        sa.Column('org_id', sa.String(), nullable=False),
        sa.Column('type', sa.Enum('ANOMALY', 'THRESHOLD', 'PREDICTIVE', 'MAINTENANCE', 'ENERGY', name='alerttype'), nullable=False),
        sa.Column('severity', sa.Enum('INFO', 'WARNING', 'CRITICAL', 'EMERGENCY', name='alertseverity'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('metric_name', sa.String(length=100), nullable=True),
        sa.Column('metric_value', sa.Float(), nullable=True),
        sa.Column('threshold_value', sa.Float(), nullable=True),
        sa.Column('is_acknowledged', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('acknowledged_by', sa.String(), nullable=True),
        sa.Column('acknowledged_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['machine_id'], ['machines.id'], ),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id'], ),
        sa.ForeignKeyConstraint(['acknowledged_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_alerts_org_severity', 'alerts', ['org_id', 'severity'])
    op.create_index('ix_alerts_machine_time', 'alerts', ['machine_id', 'created_at'])

    # Create gcode_programs table
    op.create_table(
        'gcode_programs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('org_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=True),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('line_count', sa.Integer(), nullable=True),
        sa.Column('analysis', postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('optimizations', postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('org_id', sa.String(), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('resource_type', sa.String(length=100), nullable=True),
        sa.Column('resource_id', sa.String(), nullable=True),
        sa.Column('details', postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_audit_org_time', 'audit_logs', ['org_id', 'timestamp'])

    # Create api_keys table
    op.create_table(
        'api_keys',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('key_hash', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('org_id', sa.String(), nullable=False),
        sa.Column('machine_id', sa.String(), nullable=True),
        sa.Column('scopes', postgresql.JSON(astext_type=sa.Text()), nullable=False, server_default='[]'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_used', sa.DateTime(timezone=True), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['org_id'], ['organizations.id'], ),
        sa.ForeignKeyConstraint(['machine_id'], ['machines.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('key_hash', name='uq_api_key_hash')
    )


def downgrade() -> None:
    # Drop all tables in reverse order
    op.drop_index('ix_audit_org_time', table_name='audit_logs')
    op.drop_table('audit_logs')
    op.drop_index('ix_alerts_machine_time', table_name='alerts')
    op.drop_index('ix_alerts_org_severity', table_name='alerts')
    op.drop_table('alerts')
    op.drop_index('ix_telemetry_machine_time', table_name='telemetry')
    op.drop_table('telemetry')
    op.drop_index('ix_machines_org_status', table_name='machines')
    op.drop_table('machines')
    op.drop_table('api_keys')
    op.drop_index('ix_users_org_email', table_name='users')
    op.drop_table('users')
    op.drop_table('gcode_programs')
    op.drop_table('organizations')
