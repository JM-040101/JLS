# Database Schema Documentation

## Overview
The SaaS Blueprint Generator uses Supabase PostgreSQL with Row Level Security (RLS) for multi-tenant data isolation. All tables use UUIDs as primary keys and include comprehensive audit trails.

## Architecture Diagram
```
┌─────────────────┐
│   auth.users    │ ← Supabase Auth
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    profiles     │ ← User profiles & subscriptions
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│    sessions     │────►│     answers      │
└────────┬────────┘     └──────────────────┘
         │
         ├──────────────►┌──────────────────┐
         │               │     outputs      │
         │               └──────────────────┘
         │
         └──────────────►┌──────────────────┐
                         │  export_history  │
                         └──────────────────┘

┌─────────────────┐     ┌──────────────────┐
│ phase_templates │     │    audit_log     │
└─────────────────┘     └──────────────────┘
```

## Core Tables

### 1. **profiles**
Extends Supabase Auth with subscription and user metadata.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, FK(auth.users) | User ID from Supabase Auth |
| email | TEXT | NOT NULL, UNIQUE | User email address |
| full_name | TEXT | | User's full name |
| subscription_status | TEXT | CHECK, DEFAULT 'inactive' | active/inactive/cancelled/past_due |
| subscription_id | TEXT | UNIQUE | Stripe subscription ID |
| stripe_customer_id | TEXT | UNIQUE | Stripe customer ID |
| created_at | TIMESTAMPTZ | NOT NULL | Account creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update timestamp |

**Indexes:**
- `idx_profiles_subscription_status` - Quick filtering by subscription
- `idx_profiles_stripe_customer` - Stripe webhook lookups

### 2. **sessions**
Workflow sessions for blueprint generation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Session identifier |
| user_id | UUID | NOT NULL, FK(profiles) | Owner of the session |
| app_description | TEXT | NOT NULL, 10-500 chars | SaaS idea description |
| app_name | TEXT | | Application name |
| target_audience | TEXT | | Target market |
| status | TEXT | CHECK | in_progress/completed/archived |
| completed_phases | INTEGER | 0-12 | Number of completed phases |
| current_phase | INTEGER | 1-12 | Current active phase |
| metadata | JSONB | | Additional session data |
| created_at | TIMESTAMPTZ | NOT NULL | Session start time |
| updated_at | TIMESTAMPTZ | NOT NULL | Last modification |
| completed_at | TIMESTAMPTZ | | Completion timestamp |

**Indexes:**
- `idx_sessions_user_id` - User's sessions lookup
- `idx_sessions_status` - Filter by status
- `idx_sessions_created_at` - Chronological ordering
- `idx_sessions_metadata` - JSONB queries

### 3. **answers**
User responses for each workflow phase.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Answer identifier |
| session_id | UUID | NOT NULL, FK(sessions) | Parent session |
| phase_number | INTEGER | 1-12 | Phase number |
| question_id | TEXT | NOT NULL | Question identifier |
| question_text | TEXT | NOT NULL | Question text |
| answer_text | TEXT | NOT NULL, 1-2000 chars | User's answer |
| answer_type | TEXT | CHECK | text/textarea/select/multiselect/boolean |
| metadata | JSONB | | Validation results, AI suggestions |
| created_at | TIMESTAMPTZ | NOT NULL | Answer timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | Last edit timestamp |

**Unique Constraint:** `(session_id, phase_number, question_id)`

**Indexes:**
- `idx_answers_session_id` - Session answers lookup
- `idx_answers_phase` - Phase-specific queries
- `idx_answers_question` - Question analytics

### 4. **outputs**
Generated blueprint files and documentation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Output identifier |
| session_id | UUID | NOT NULL, FK(sessions) | Parent session |
| file_name | TEXT | NOT NULL | Display name |
| file_path | TEXT | NOT NULL | Virtual file path |
| file_content | TEXT | NOT NULL | File contents |
| file_type | TEXT | CHECK | md/json/txt/prompt/yaml/ts/js |
| file_size | INTEGER | DEFAULT 0 | Content size in bytes |
| category | TEXT | CHECK | readme/module/prompt/config/documentation |
| metadata | JSONB | | Generation metadata |
| created_at | TIMESTAMPTZ | NOT NULL | Generation timestamp |
| version | INTEGER | DEFAULT 1 | File version |

**Unique Constraint:** `(session_id, file_path)`

**Indexes:**
- `idx_outputs_session_id` - Session outputs lookup
- `idx_outputs_category` - Filter by category
- `idx_outputs_file_type` - Filter by type

### 5. **phase_templates**
Template questions for each workflow phase.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Template identifier |
| phase_number | INTEGER | UNIQUE, 1-12 | Phase number |
| title | TEXT | NOT NULL | Phase title |
| description | TEXT | NOT NULL | Phase description |
| estimated_time | INTEGER | DEFAULT 15 | Time in minutes |
| questions | JSONB | NOT NULL | Question definitions |
| help_text | TEXT | | Guidance text |
| created_at | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |

**Questions JSONB Structure:**
```json
[
  {
    "id": "q1",
    "type": "text",
    "label": "Question text",
    "required": true,
    "placeholder": "Enter...",
    "validation": {
      "minLength": 10,
      "maxLength": 500
    }
  }
]
```

### 6. **export_history**
Track blueprint exports and downloads.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Export identifier |
| session_id | UUID | NOT NULL, FK(sessions) | Exported session |
| user_id | UUID | NOT NULL, FK(profiles) | User who exported |
| export_type | TEXT | CHECK | zip/github/gitlab/download |
| file_url | TEXT | | Storage URL |
| file_size | INTEGER | | Export size in bytes |
| metadata | JSONB | | Export metadata |
| expires_at | TIMESTAMPTZ | | URL expiration |
| created_at | TIMESTAMPTZ | NOT NULL | Export timestamp |

**Indexes:**
- `idx_export_history_session` - Session exports
- `idx_export_history_user` - User exports
- `idx_export_history_expires` - Cleanup expired exports

### 7. **audit_log**
System-wide audit trail.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Log entry ID |
| user_id | UUID | FK(profiles), NULL on delete | Acting user |
| action | TEXT | NOT NULL | Action performed |
| entity_type | TEXT | NOT NULL | Target entity type |
| entity_id | UUID | | Target entity ID |
| changes | JSONB | | Change details |
| ip_address | INET | | Client IP |
| user_agent | TEXT | | Browser info |
| created_at | TIMESTAMPTZ | NOT NULL | Action timestamp |

**Indexes:**
- `idx_audit_log_user` - User activity
- `idx_audit_log_entity` - Entity history
- `idx_audit_log_created` - Chronological order
- `idx_audit_log_action` - Action filtering

## Row Level Security (RLS)

### Security Model
All tables have RLS enabled with policies enforcing:
1. **Data Isolation**: Users can only access their own data
2. **Subscription Validation**: Session creation requires active subscription
3. **Immutability**: Certain records cannot be modified after creation
4. **Audit Trail**: All actions are logged

### Key RLS Policies

**profiles:**
- SELECT: Own profile only
- UPDATE: Own profile, cannot modify subscription fields
- INSERT: During registration only

**sessions:**
- SELECT/UPDATE/DELETE: Own sessions only
- INSERT: Requires active subscription (trigger enforced)

**answers:**
- SELECT: Own session answers
- INSERT/UPDATE/DELETE: Only for in_progress sessions

**outputs:**
- SELECT: Own session outputs
- INSERT/UPDATE: System-generated via service role
- DELETE: Own outputs only

**phase_templates:**
- SELECT: Public read access
- INSERT/UPDATE/DELETE: Admin only

**export_history:**
- SELECT: Own exports
- INSERT: Own sessions only
- DELETE: Own or expired exports

**audit_log:**
- SELECT: Own activities
- INSERT: System-generated
- UPDATE/DELETE: Not allowed (immutable)

## Database Functions

### Helper Functions

**`update_updated_at_column()`**
- Trigger function to auto-update `updated_at` timestamps
- Applied to: profiles, sessions, answers, phase_templates

**`update_session_progress()`**
- Automatically updates session progress when answers are added
- Updates `completed_phases` and `current_phase`

**`check_subscription_before_session()`**
- Validates active subscription before session creation
- Enforces max 3 concurrent sessions limit

### Utility Functions

**`user_owns_session(session_uuid UUID)`**
- Returns: BOOLEAN
- Checks if current user owns the specified session

**`user_has_active_subscription()`**
- Returns: BOOLEAN
- Checks if current user has active subscription

**`get_user_session_count(status_filter TEXT)`**
- Returns: INTEGER
- Gets count of user's sessions, optionally filtered by status

## Performance Considerations

### Indexing Strategy
- Foreign key columns indexed for JOIN performance
- Status/type columns indexed for filtering
- JSONB columns use GIN indexes for containment queries
- Composite indexes for common query patterns

### Data Limits
- Answer text: Max 2000 characters
- Session description: 10-500 characters
- Max 3 concurrent in_progress sessions per user
- Max 12 phases per session

### Optimization Tips
1. Use partial indexes for status-based queries
2. Vacuum regularly for deleted session cleanup
3. Monitor JSONB field sizes in metadata columns
4. Consider partitioning audit_log by date for large datasets

## Migration Strategy

### Initial Setup
1. Run `001_create_core_tables.sql` to create schema
2. Run `002_enable_rls_policies.sql` to enable security
3. Seed `phase_templates` with workflow questions

### Version Management
- Migrations numbered sequentially (001, 002, etc.)
- Each migration is idempotent (safe to re-run)
- Rollback scripts maintained separately

### Backup Strategy
- Daily automated backups via Supabase
- Point-in-time recovery available
- Export critical data before major migrations