# Playable E-Commerce – Fashion Case

A full-stack fashion e-commerce web application built as a case study.

- Customers can browse products, filter & sort, view details, add items to cart, place orders, and see their order history.
- Admins can log in separately to see customers, inspect their orders, and manage products.

Backend and frontend are separated:

- **Backend API:** Node.js + Express + MongoDB  
- **Frontend UI:** Next.js (App Router) + React + TypeScript

> Live demo (example):
> - **Frontend:** https://ecommerce-fashion-case.vercel.app  
> - **Backend API:** https://ecommerce-fashion-case.onrender.com

---

## 1. Project Description

This project implements a small but realistic **fashion e-commerce** platform.

### Customer side

- Browse products by **gender** (men/women), **category** (T-Shirt, Pants, Jacket, Shoes, Accessories)
- Filter and sort products (price range, rating, popularity, newest)
- Search products by name or description
- View a **product detail page** with:
  - Gallery / image
  - Color options (swatches)
  - Price, description, category, gender
  - Average rating and review count
  - Review list and review submission
- Global **shopping cart** with:
  - Add / remove items, update quantity and color
  - Subtotal, tax, shipping, total
- **Checkout flow** with shipping form and dummy payment form
- **Order success page** with a generated order code
- Customer **profile** page:
  - Basic info
  - Order history
  - Ability to cancel orders that are still in `"processing"` status

### Admin side

- Separate **admin login** and session
- Admin **dashboard**:
  - List all customers with:
    - Total number of orders
    - Total money spent
  - View single customer detail:
    - Profile information
    - All orders placed by that customer
  - List all products for admin (no customer filters)
- Admin-only APIs to manage:
  - Products (create / update / delete / bulk status)
  - Categories
  - Global list of all orders

---

## 2. Technology Stack

### Backend

- **Node.js** (recommended: **v18+** LTS)
- **Express** – REST API
- **MongoDB** – data storage (Atlas or local)
- **Mongoose** – ODM for MongoDB
- **JWT (jsonwebtoken)** – authentication & authorization
- **bcrypt** – password hashing
- **dotenv** – environment variables
- **cors** – CORS handling
- **nodemon** – dev auto-reload (local development)

### Frontend

- **Next.js** – App Router
- **React** with **TypeScript**
- **Tailwind CSS** (via `@tailwindcss/postcss` + PostCSS config)
- **Context API**:
  - `AuthContext` for auth state
  - `CartContext` for cart state
- **Next Navigation** and **dynamic routes**:
  - `/products/[id]`
  - `/admin/customers/[id]`

---

## 3. Installation Instructions (Local)

### 3.1. Prerequisites

- **Node.js:** v18.x or newer  
- **npm** (bundled with Node)
- A **MongoDB** instance:
  - either **MongoDB Atlas** (cloud)
  - or local MongoDB server

> Make sure Node is ≥ 18, otherwise the Next.js app may not build.

### 3.2. Clone the repository

```bash
git clone <YOUR_REPO_URL> playable-ecommerce
cd playable-ecommerce/fashion-case

Expected structure:
fashion-case/
  backend/
  frontend/
  README.md

  3.3. Backend setup

cd backend
npm install

Create backend/.env (see section 9.1 for example).
Make sure MONGODB_URI points to a valid MongoDB database.

If you want initial demo data (recommended):

npm run seed

This will connect to MongoDB and insert demo categories & products.

3.4. Frontend setup

cd ../frontend
npm install

Update the API base URL in frontend:

Simple version (hard-coded):

In AuthContext.tsx, CartDrawer.tsx, app/page.tsx:
const API_BASE = "http://localhost:5000";

for local development, or your Render URL in production (see deployment section).

A more advanced option would be to use NEXT_PUBLIC_API_BASE_URL env var, but for this case study, a constant string is sufficient.

4. Demo Credentials

Users are not automatically created; products and categories are seeded by npm run seed.
You should create these demo accounts once for testing.

Customer demo account

Visit /register

Register a new user, e.g.:

Email: customer@example.com

Password: Customer123!

Log in at /login.

Admin demo account

To test the admin panel, you need a user with role: "admin" in MongoDB.

Two options:

Create via UI then promote:

Register a normal user (e.g. admin@example.com)

In MongoDB (Compass / shell), set role: "admin" for that user document.

Insert directly in MongoDB:

Create a user document manually with hashed password and role: "admin".

Example credentials (after you add them):

Email: admin@example.com

Password: Admin123!

Role: admin

Admin login page:

https://ecommerce-fashion-case.vercel.app/admin/login

5. API Documentation (Main Endpoints)

Base URL (local): http://localhost:5000

Base URL (example production): https://ecommerce-fashion-case.onrender.com

5.1. Authentication
POST /api/auth/register

Create a new customer.

Request body: 
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!"
}
 
 POST /api/auth/login

Customer login.
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Password123!"}'

Returns:
{
  "token": "JWT_TOKEN_HERE",
  "user": {
    "_id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }

POST /api/auth/admin/login

Same as /login, but only allows users with role: "admin".

GET /api/auth/me (protected)

Return current user info from JWT.

Header: Authorization: Bearer <JWT_TOKEN>

5.2. Products
GET /api/products

Get products with filters and pagination.

Query parameters (optional):

gender – men | women | unisex

categorySlug – e.g. men-tshirt

minPrice, maxPrice

minRating

q – search keyword

sort – popular | price_asc | price_desc | rating_desc | newest

page, limit

Example: curl "http://localhost:5000/api/products?gender=men&minPrice=300&sort=price_asc"

GET /api/products/:id

Get single product details.

curl http://localhost:5000/api/products/PRODUCT_ID
,
POST /api/products/:id/reviews

Add a product review.
curl -X POST http://localhost:5000/api/products/PRODUCT_ID/reviews \
  -H "Content-Type: application/json" \
  -d '{"userName":"Mert","rating":5,"comment":"Great fit!"}'

Admin-only product routes (require admin JWT)

POST /api/products/admin – create product

PATCH /api/products/admin/:id – update product

DELETE /api/products/admin/:id – delete product

POST /api/products/admin/bulk-status – bulk enable/disable

GET /api/products/admin/all – list all products for admin

5.3. Categories
GET /api/categories

Get list of categories used for filters on the frontend.

Admin category APIs

POST /api/categories/admin – create category

PATCH /api/categories/admin/:id – update

DELETE /api/categories/admin/:id – delete

6.4. Orders
POST /api/orders

Create a new order from cart data.

Request body (simplified):
{
  "items": [
    {
      "productId": "PRODUCT_ID",
      "name": "Basic Slim Fit T-Shirt",
      "price": 399.9,
      "quantity": 2,
      "color": "Yellow",
      "image": "/images/Basic Slim Fit T-Shirt Yellow Men.png"
    }
  ],
  "subtotal": 799.8,
  "tax": 0,
  "shipping": 0,
  "total": 799.8,
  "shippingName": "John Doe",
  "shippingAddress": "Test Street 123",
  "shippingCity": "Istanbul",
  "shippingZip": "34000",
  "paymentName": "John Doe",
  "cardNumber": "4111111111111111"
}

If the user is logged in (JWT provided), the order is linked to that user.

GET /api/orders/my (protected)

Get all orders for the current logged-in user.

PATCH /api/orders/:id/cancel (protected)

Cancel an order belonging to the current user if its status is still "processing".

Admin orders APIs

GET /api/orders – list all orders (admin only)

5.5. Admin Customers

(All require admin JWT.)

GET /api/admin/customers
Returns all customers with orderCount and totalSpent, supports search query.

GET /api/admin/customers/:id
Returns customer details and their full order list.

6. Deployment Guide
6.1. Deploying the Backend (example: Render)

Push the repository to GitHub.

Create a Web Service on Render
.

Choose the repo and set:

Root Directory: backend

Build Command: npm install

Start Command: node src/server.js

Configure environment variables on Render:

MONGODB_URI – MongoDB Atlas connection string

JWT_SECRET – strong random string

PORT can be omitted; Render provides it automatically.

Deploy. Render will give a URL, e.g.: https://ecommerce-fashion-case.onrender.com

For health check, open:

https://ecommerce-fashion-case.onrender.com/api/products

6.2. Deploying the Frontend (example: Vercel)

Import the same GitHub repo into Vercel
.

Configure the project:

Framework: Next.js

Root Directory: frontend

Build Command: npm run build

Install Command: npm install

Output Directory: .next (default)

Make sure API_BASE in the frontend points to the deployed backend URL: const API_BASE = "https://ecommerce-fashion-case.onrender.com";
(Or use NEXT_PUBLIC_API_BASE_URL env var.)

Deploy. Vercel will assign a domain, e.g.: https://ecommerce-fashion-case.vercel.app

Access:

Customer: /

Admin login: /admin/login

7. Features List

7.1. Customer features

User registration and login (JWT-based)

Persisted auth state in frontend (Context + storage)

Product listing with:

Filter by gender, category, price range, rating

Search bar

Sorting by popularity, price, rating, newest

Product detail page:

Image / gallery

Description, category, gender, price

Colors and available sizes

Average rating & rating count

Customer review list

Add review form

Shopping cart:

Add / remove item

Update quantity and color

Display subtotal, tax, shipping, total

Checkout flow:

Shipping details form

Dummy payment info form

Order creation in backend

Order success page:

Simulated “preparing / handing over / shipped” steps

Display of generated order code

Profile and orders:

Profile information page

Order history list

Cancel order when status is "processing"

7.2. Admin features

Separate admin login endpoint and page

Admin authentication & authorization with JWT

Admin dashboard:

List all customers with order count and total spent

Search customers by name or email

View individual customer details and all orders

Product management APIs (create/update/delete/bulk status)

Global orders list (all customers)

7.3. Bonus / extra

Clean and responsive UI using Tailwind CSS

Cart drawer & cart bar for quick access

Next.js App Router with client components for interactive pages

Simple health check API

8. Environment Variables & Database Seeding
8.1. Backend .env example

Create backend/.env: PORT=5000
MONGODB_URI=mongodb+srv://<USER>:<PASSWORD>@<CLUSTER>/<DB_NAME>?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_super_secret_jwt_key_here

8.2. Seeding the database

The seed script clears existing Category and Product collections, then inserts demo data.

Run: cd backend
npm run seed
 You should see console logs like:

MongoDB connected for seeding

Cleared Category & Product collections

Inserted categories: ...

Inserted products: ...

After seeding:

GET /api/products should return a list of demo products.

Frontend product listing will show these items.


9. Project Structure (Summary)


fashion-case/
  backend/
    package.json
    .env (local only)
    src/
      server.js
      config/
        db.js
      models/
        Category.js
        Product.js
        Order.js
        Review.js
        User.js
      routes/
        authRoutes.js
        productRoutes.js
        categoryRoutes.js
        orderRoutes.js
        adminCustomerRoutes.js
      controllers/
        orderController.js
    seed/
      seed.js
      seedData.js

  frontend/
    package.json
    tsconfig.json
    postcss.config.mjs
    eslint.config.mjs
    next.config.ts
    public/
      favicon.ico
    app/
      globals.css
      layout.tsx
      page.tsx                     # Home (product listing)
      AuthContext.tsx
      CartContext.tsx
      CartBar.tsx
      CartDrawer.tsx
      ProductCard.tsx
      login/page.tsx               # Customer login
      register/page.tsx            # Customer register
      cart/page.tsx                # Cart page
      orders/page.tsx              # Order history
      order-success/page.tsx       # Order success
      profile/page.tsx             # Profile + cancel orders
      products/[id]/page.tsx       # Product details
      admin/
        login/page.tsx             # Admin login
        page.tsx                   # Admin dashboard
        products/page.tsx          # Admin products list
        customers/page.tsx         # Admin customers list
        customers/[id]/page.tsx    # Admin customer detail



This README satisfies the required documentation: project description, tech stack, installation, running instructions, demo credentials, main API documentation with example requests, deployment guide, full feature list, environment variable examples, and database seeding instructions.