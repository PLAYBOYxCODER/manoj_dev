-- ==========================================
-- ABHIRUCHI RESTAURANTS - DATABASE SCHEMA
-- ==========================================

-- 1. Tables Table
-- Purpose: Manages the restaurant tables for QR ordering.
CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_number VARCHAR(10) UNIQUE NOT NULL,
    qr_code_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Menu Items Table
-- Purpose: Stores all products (biryanis, starters, etc.) 
-- Though we use static data in the frontend right now, having this allows the owner to manage items dynamically in the future.
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(5, 2) DEFAULT 0,
    stock_status VARCHAR(50) DEFAULT 'Available',
    image_url TEXT,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Orders Table
-- Purpose: Stores the main order record for a table.
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_number VARCHAR(10) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    total_price DECIMAL(10, 2) NOT NULL,
    order_status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Preparing', 'Ready', 'Served'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Real-Time for Orders Table
alter publication supabase_realtime add table orders;

-- 4. Order Items Table
-- Purpose: Stores individual items inside an order (1 order -> many order items).
-- Relationship: Links to orders table via order_id.
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    price_per_item DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Feedback Table
-- Purpose: Stores customer feedback from the contact/feedback page.
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name VARCHAR(255),
    phone_number VARCHAR(20),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Admins Table
-- Purpose: Stores internal admin users for the dashboard (if not using Supabase Auth).
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'owner',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Orders: Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow public to INSERT orders (Customers placing orders)
CREATE POLICY "Allow public insert to orders" ON orders FOR INSERT WITH CHECK (true);

-- Allow public to SELECT orders (Customers checking own order / Admin viewing)
CREATE POLICY "Allow public select on orders" ON orders FOR SELECT USING (true);

-- Allow public to UPDATE orders (Admin updating status, ideally protect this with auth later)
CREATE POLICY "Allow public update on orders" ON orders FOR UPDATE USING (true);

-- Order Items: Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert to order items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on order items" ON order_items FOR SELECT USING (true);

-- Feedback: Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert to feedback" ON feedback FOR INSERT WITH CHECK (true);
-- Allow public or owner to read feedback
CREATE POLICY "Allow public select on feedback" ON feedback FOR SELECT USING (true);

-- ==========================================
-- End of Schema
-- ==========================================
