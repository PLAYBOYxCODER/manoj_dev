# Abhiruchi Restaurant - Platform Setup Guide 

## 1. Supabase Setup Guide

This database handles the real-time ordering system. Follow these steps to configure it:

1. **Create Supabase Project**
   - Go to [Supabase](https://supabase.com/).
   - Click "New Project" and enter your details.

2. **Open SQL Editor**
   - In your newly created project dashboard, navigate to the **SQL Editor** on the left menu.

3. **Run Database Scripts**
   - Copy everything from `supabase-schema.sql` (located in the root folder of this codebase).
   - Paste it into the SQL Editor and click **Run**.
   - *This will create all necessary tables: `tables`, `menu_items`, `orders`, `order_items`, etc.*

4. **Enable Realtime**
   - The SQL script actually does it out-of-the-box (`alter publication supabase_realtime add table orders`). 
   - Verify by going to **Database > Publications > supabase_realtime** and ensure `orders` has a toggle turned ON.

5. **Get API Keys**
   - Go to **Project Settings > API**.
   - Find your **Project URL**.
   - Find your **anon public** key.

6. **Add Environment Variables**
   - In your `web-app` folder, create `.env.local`:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
     ```
   *(For full admin rights/backend functions, also add `SUPABASE_SERVICE_ROLE_KEY` if required down the line from the exact same API page).*

---

## 2. Deployment Instructions

1. **Push project to GitHub**
   - Initialize git in your project:
     ```bash
     git init
     git add .
     git commit -m "Initial commit for Abhiruchi"
     git branch -M main
     git remote add origin https://github.com/yourusername/abhiruchi-app.git
     git push -u origin main
     ```

2. **Import project into Vercel**
   - Go to [Vercel](https://vercel.com/) and log in.
   - Click "Add New..." -> "Project".
   - Import your GitHub repository.

3. **Add Environment Variables**
   - During the import process on Vercel, expand "Environment Variables".
   - Add:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Paste your keys from Supabase exactly as they are.

4. **Deploy Website**
   - Click **Deploy**. Vercel will build and launch your real-time restaurant ordering app.

---

## 3. QR Code Table Setup

Your website supports dynamic QR code scanning for users resting at different tables.

### How it works:
When a customer scans a QR code, they are directed to the custom URL `restaurant.com/table/1`. The website will instantly register them to Table 1, and any order they make automatically traces back to Table 1.

### Step-by-step QR creation:
1. Define your web domain (e.g., `abhiruchi.vercel.app` or `abhiruchibiryani.com`).
2. Generate QR URLs for each table using a free QR Generator (like [qr-code-generator.com](https://www.qr-code-generator.com/)):
   - Table 1 -> `https://abhiruchibiryani.com/table/1`
   - Table 2 -> `https://abhiruchibiryani.com/table/2`
   - ...and so on.
3. Print these QR codes, laminate them, and place them on individual tables.

### How the Owner adds more tables:
- Currently, the Next.js app dynamically accepts any `[id]` passed to `/table/[id]`.
- For strict monitoring, you can add table entries directly inside Supabase. Go to **Table Editor > `tables`**, click **Insert Row**, and type the `table_number` (e.g., "5"). 
- No developer intervention is ever needed to expand up to 50–60 tables or more.
