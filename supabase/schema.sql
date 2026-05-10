-- 1. USER PROFILES
create table user_profiles (
  id uuid references auth.users primary key,
  name text,
  city text,
  skin_type text,
  concerns text[],
  routine_level text,
  photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table user_profiles enable row level security;
create policy "Users can view own profile" on user_profiles for all using (auth.uid() = id);

-- 2. SKIN REPORTS
create table skin_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references user_profiles(id) on delete cascade,
  overall_glow_score int,
  skin_type text,
  concerns jsonb,
  insights jsonb,
  climate_note text,
  routine_complexity text,
  photo_url text,
  created_at timestamptz default now()
);
alter table skin_reports enable row level security;
create policy "Users can view own reports" on skin_reports for all using (auth.uid() = user_id);

-- 3. PRODUCTS
create table products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  brand text not null,
  category text,
  price_inr int,
  image_url text,
  affiliate_url text,
  key_ingredients text[],
  skin_types text[],
  concerns_targeted text[],
  climate_suitability text[],
  texture text,
  korean_step text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 4. ROUTINE KITS (saved recommendations)
create table routine_kits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references user_profiles(id),
  report_id uuid references skin_reports(id),
  products jsonb,   -- array of {stepName, product_id, whyForYou}
  created_at timestamptz default now()
);
alter table routine_kits enable row level security;
create policy "Users can view own kits" on routine_kits for all using (auth.uid() = user_id);

-- 5. ORDERS
create table orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references user_profiles(id),
  kit_id uuid references routine_kits(id),
  razorpay_order_id text,
  razorpay_payment_id text,
  amount_inr int,
  status text default 'pending',  -- pending | paid | shipped | delivered
  delivery_address jsonb,
  products jsonb,
  created_at timestamptz default now()
);
alter table orders enable row level security;
create policy "Users can view own orders" on orders for all using (auth.uid() = user_id);

-- 6. ROUTINE LOGS (daily habit tracking)
create table routine_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references user_profiles(id),
  date date default current_date,
  steps_completed text[],
  glow_note text,
  created_at timestamptz default now(),
  unique(user_id, date)
);
alter table routine_logs enable row level security;
create policy "Users can manage own logs" on routine_logs for all using (auth.uid() = user_id);

-- 7. WAITLIST (existing — extend with converted flag)
alter table waitlist add column if not exists converted_at timestamptz;
alter table waitlist add column if not exists user_id uuid references user_profiles(id);