# Supabase Postgres Best Practices
# Source: github.com/supabase/agent-skills (MIT License)
# Compiled for MyStation by CHANDLA — Feb 23, 2026

---

## 1. CRITICAL: Add Indexes on WHERE and JOIN Columns

Queries filtering or joining on unindexed columns cause full table scans.

```sql
-- BAD: No index = full table scan
select * from orders where customer_id = 123;

-- GOOD: Index on filtered column
create index orders_customer_id_idx on orders (customer_id);
select * from orders where customer_id = 123;
-- Index Scan: 100-1000x faster on large tables
```

For JOINs, always index the foreign key side.

---

## 2. CRITICAL: Enable Row Level Security

RLS enforces data access at the database level. Never rely on app-level filtering alone.

```sql
-- Enable RLS
alter table orders enable row level security;

-- Policy for authenticated users (Supabase auth)
create policy orders_user_policy on orders
  for all
  to authenticated
  using (user_id = auth.uid());

-- Force RLS even for table owners
alter table orders force row level security;
```

---

## 3. CRITICAL: Optimize RLS Performance

Wrap auth functions in SELECT to avoid per-row evaluation.

```sql
-- BAD: auth.uid() called for EVERY row
create policy orders_policy on orders
  using (auth.uid() = user_id);

-- GOOD: Called once, cached (100x+ faster on large tables)
create policy orders_policy on orders
  using ((select auth.uid()) = user_id);
```

For complex checks, use security definer functions:

```sql
create or replace function is_team_member(team_id bigint)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members
    where team_id = $1 and user_id = (select auth.uid())
  );
$$;

create policy team_orders_policy on orders
  using ((select is_team_member(team_id)));
```

Always index columns used in RLS policies.

---

## 4. CRITICAL: Use Connection Pooling

Postgres connections cost 1-3MB RAM each. Use PgBouncer/Supavisor.

- **Transaction mode**: connection returned after each transaction (best for most apps)
- **Session mode**: connection held for entire session (needed for prepared statements)
- Pool size formula: `(CPU cores * 2) + spindle_count`
- 500 concurrent users can share ~10 actual connections

---

## 5. HIGH: Composite Indexes for Multi-Column Queries

Place equality columns first, range columns last.

```sql
-- GOOD: status (=) before created_at (>)
create index orders_status_created_idx on orders (status, created_at);

-- Works for: WHERE status = 'pending'
-- Works for: WHERE status = 'pending' AND created_at > '2024-01-01'
-- Does NOT work for: WHERE created_at > '2024-01-01' alone (leftmost prefix rule)
```

---

## 6. HIGH: Index Foreign Key Columns

Postgres does NOT auto-index foreign keys. Missing indexes = slow JOINs + slow CASCADE.

```sql
create table orders (
  id bigint generated always as identity primary key,
  customer_id bigint references customers(id) on delete cascade,
  total numeric(10,2)
);

-- ALWAYS add this:
create index orders_customer_id_idx on orders (customer_id);
```

Find missing FK indexes:

```sql
select conrelid::regclass as table_name, a.attname as fk_column
from pg_constraint c
join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
where c.contype = 'f'
  and not exists (
    select 1 from pg_index i
    where i.indrelid = c.conrelid and a.attnum = any(i.indkey)
  );
```

---

## 7. HIGH: Primary Key Strategy

```sql
-- Single database: bigint identity (sequential, 8 bytes, SQL-standard)
create table users (
  id bigint generated always as identity primary key
);

-- Distributed/exposed IDs: UUIDv7 (time-ordered, no fragmentation)
create table orders (
  id uuid default uuid_generate_v7() primary key
);
```

- Prefer `identity` over `serial` (SQL-standard)
- Avoid random UUIDs (v4) as PKs on large tables (index fragmentation)

---

## 8. MEDIUM-HIGH: Eliminate N+1 Queries

```sql
-- BAD: 101 round trips
select id from users where active = true;  -- 100 IDs
select * from orders where user_id = 1;    -- per user...

-- GOOD: 1 round trip
select u.id, u.name, o.*
from users u
left join orders o on o.user_id = u.id
where u.active = true;

-- Or batch with ANY:
select * from orders where user_id = any($1::bigint[]);
```

---

## 9. MEDIUM-HIGH: Cursor Pagination over OFFSET

OFFSET scans all skipped rows. Cursor pagination is O(1).

```sql
-- BAD: Page 10000 scans 200K rows
select * from products order by id limit 20 offset 199980;

-- GOOD: Same speed on any page
select * from products where id > 199980 order by id limit 20;
```

Multi-column cursor:

```sql
select * from products
where (created_at, id) > ('2024-01-15 10:00:00', 12345)
order by created_at, id
limit 20;
```

---

## 10. LOW-MEDIUM: EXPLAIN ANALYZE for Diagnostics

```sql
explain (analyze, buffers, format text)
select * from orders where customer_id = 123 and status = 'pending';
```

Red flags:
- **Seq Scan on large tables** = missing index
- **Rows Removed by Filter** = poor selectivity
- **Buffers: read >> hit** = data not cached
- **Nested Loop with high loops** = consider different join
- **Sort Method: external merge** = work_mem too low

---

## MyStation-Specific Notes

- We use Supabase for auth (auth.uid()), comments, analytics, subscriptions, tickets
- All RLS policies MUST use `(select auth.uid())` pattern (not bare `auth.uid()`)
- Connection pooling is handled by Supabase's built-in Supavisor
- Use `bigint identity` for new tables, existing tables use Supabase defaults
- Always index user_id, email, and any column used in WHERE/JOIN/RLS
