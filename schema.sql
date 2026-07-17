-- =============================================================
-- VendorFlow Database Schema for Supabase (PostgreSQL)
-- Run this in the Supabase SQL Editor (once)
-- =============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- =============================================================
-- TABLES
-- =============================================================

-- Vendor profiles (linked 1:1 to auth.users)
create table if not exists vendors (
    id          uuid default uuid_generate_v4() primary key,
    user_id     uuid references auth.users(id) on delete cascade not null unique,
    name        text not null,
    phone       text,
    school      text default 'School Gate',
    created_at  timestamptz default now()
);

-- Per-vendor app settings
create table if not exists settings (
    id                      uuid default uuid_generate_v4() primary key,
    vendor_id               uuid references vendors(id) on delete cascade not null unique,
    exchange_rate_usd_to_zar numeric(10, 4) default 18.5 not null,
    display_currency         text default 'USD' check (display_currency in ('USD', 'ZAR')),
    updated_at               timestamptz default now()
);

-- Product catalogue
create table if not exists products (
    id              uuid default uuid_generate_v4() primary key,
    vendor_id       uuid references vendors(id) on delete cascade not null,
    name            text not null,
    category        text not null check (category in ('burgers','drinks','snacks','rice','sweets','chips','sausages')),
    buy_price_usd   numeric(10, 2) not null check (buy_price_usd >= 0),
    sell_price_usd  numeric(10, 2) not null check (sell_price_usd >= 0),
    stock_qty       integer default 0 check (stock_qty >= 0),
    low_stock_alert integer default 5,
    is_active       boolean default true,
    created_at      timestamptz default now(),
    updated_at      timestamptz default now()
);

-- Sales records
create table if not exists sales (
    id                  uuid default uuid_generate_v4() primary key,
    vendor_id           uuid references vendors(id) on delete cascade not null,
    product_id          uuid references products(id) not null,
    qty                 integer not null check (qty > 0),
    unit_price_usd      numeric(10, 2) not null,
    currency_received   text default 'USD' check (currency_received in ('USD', 'ZAR')),
    amount_received     numeric(10, 2),
    total_usd           numeric(10, 2) not null,
    sale_date           date default current_date,
    created_at          timestamptz default now()
);

-- Expense records
create table if not exists expenses (
    id              uuid default uuid_generate_v4() primary key,
    vendor_id       uuid references vendors(id) on delete cascade not null,
    description     text not null,
    amount_usd      numeric(10, 2) not null check (amount_usd > 0),
    category        text default 'other' check (category in ('restocking','transport','other')),
    expense_date    date default current_date,
    created_at      timestamptz default now()
);

-- =============================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================

alter table vendors  enable row level security;
alter table settings enable row level security;
alter table products enable row level security;
alter table sales    enable row level security;
alter table expenses enable row level security;

-- Vendors: each user can only see/edit their own vendor row
create policy "vendors_self" on vendors
    for all using (user_id = auth.uid());

-- Settings: vendor can only access their own settings
create policy "settings_own" on settings
    for all using (
        vendor_id in (select id from vendors where user_id = auth.uid())
    );

-- Products: vendor can only access their own products
create policy "products_own" on products
    for all using (
        vendor_id in (select id from vendors where user_id = auth.uid())
    );

-- Sales: vendor can only access their own sales
create policy "sales_own" on sales
    for all using (
        vendor_id in (select id from vendors where user_id = auth.uid())
    );

-- Expenses: vendor can only access their own expenses
create policy "expenses_own" on expenses
    for all using (
        vendor_id in (select id from vendors where user_id = auth.uid())
    );

-- =============================================================
-- HELPER FUNCTION: auto-update "updated_at"
-- =============================================================

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger products_updated_at before update on products
    for each row execute procedure update_updated_at();

create trigger settings_updated_at before update on settings
    for each row execute procedure update_updated_at();

-- =============================================================
-- INDEXES for common query patterns
-- =============================================================

create index if not exists sales_vendor_date    on sales(vendor_id, sale_date desc);
create index if not exists expenses_vendor_date on expenses(vendor_id, expense_date desc);
create index if not exists products_vendor      on products(vendor_id, is_active);
