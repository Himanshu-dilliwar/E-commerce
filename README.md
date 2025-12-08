📦 E-Commerce Platform — Next.js, Razorpay, Clerk, Sanity CMS

A fully functional, modern e-commerce application built with Next.js 14, TypeScript, TailwindCSS, Razorpay Payments, Clerk Authentication, and Sanity CMS for product & order management.

This project simulates a real-world production setup with authentication, CRUD operations, secure payment flow, CMS-driven content, and a responsive UI.

🚀 Features
🛍️ E-Commerce Core

Product listing (CMS-powered)

Product details page

Add to cart functionality

CRUD operations for products & orders

💳 Payment Gateway (Razorpay)

Secure checkout flow

Server-side order creation

Signature verification

Payment success & failure handling

Webhook-ready structure

🔐 Authentication (Clerk)

User login/signup

Session handling

Protected routes

Order history for logged-in users

🧵 CMS Integration (Sanity)

Product management

Order dashboard

Real-time CMS updates

GROQ queries for optimized data fetching

🎨 Modern UI (Next.js + TailwindCSS)

Fully responsive

Clean and minimal design

Smooth user experience

🧰 Tech Stack
Category	Tools
Frontend	Next.js 14, TypeScript, React
Styling	TailwindCSS
Authentication	Clerk
Payments	Razorpay
CMS	Sanity.io
Hosting	Coming soon (Vercel recommended)
📂 Project Structure
├── app/
│   ├── (routes)/
│   ├── api/
│   │   ├── checkout/
│   │   ├── verify/
│   ├── layout.tsx
│   └── page.tsx
├── components/
├── lib/
│   ├── razorpay.ts
│   ├── sanity.ts
├── sanity/
│   ├── schemas/
│   └── config.ts
└── utils/

🚀 Getting Started
1️⃣ Clone the Repository
git clone https://github.com/your-username/ecommerce-razorpay-sanity.git
cd ecommerce-razorpay-sanity

2️⃣ Install Dependencies
npm install

3️⃣ Set Environment Variables

Create a .env.local file:

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

SANITY_PROJECT_ID=
SANITY_DATASET=
SANITY_API_VERSION=

SANITY_WRITE_TOKEN=

4️⃣ Run the Development Server
npm run dev


Your app will be live at:
👉 http://localhost:3000

💳 Razorpay Flow

User proceeds to checkout

Server creates a Razorpay order (/api/checkout)

User pays via Razorpay widget

Razorpay returns payment_id + order_id + signature

Backend verifies signature via /api/verify

Order is stored in Sanity CMS

🧵 Sanity CMS Setup
Install Sanity CLI:
npm install -g @sanity/cli

Create CMS:
sanity init

Schemas included:

product

order

🔐 Authentication (Clerk)

Add the <ClerkProvider> in layout.tsx
Protect routes with:

import { auth } from "@clerk/nextjs";

const { userId } = auth();
if (!userId) redirect("/sign-in");

📸 Screenshots

(Add your images here)

🖼️ Homepage

🖼️ Payment Checkout

🖼️ Sanity Dashboard

🧪 Future Enhancements

Admin dashboard (analytics, product management UI)

Enhanced caching with ISR/SSR strategies

Order tracking system

Coupon/discount integration

Improved webhook security

Deployment to Vercel (coming soon)

🤝 Contributing

Feel free to fork this repo and submit PRs!

⭐ If this project helped you, please give it a star!
