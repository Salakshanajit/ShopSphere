# ShopSphere – Full-Stack E-Commerce Web Application

A beginner-friendly online store built with **React (Vite)**, **Node.js + Express**, **MySQL**, **JWT** login and **bcrypt** password hashing.
Customers can browse products, fill a cart, place a demo order and track it. Admins manage products and orders from a dashboard.

> **Honest status note:** the code was written and checked in an environment that could not reach the npm registry or run MySQL.
> What was verified there: all server and client files pass syntax checks, every import resolves, and the 12 validation unit tests pass.
> **Not yet run:** `npm install`, the React build, the MySQL scripts and the API integration tests (`server/tests/api.test.js`).
> Follow the steps below and use the checklist in section 9 – if anything fails, the "Troubleshooting" section covers the likely causes.

---

## 1. What you need installed

| Tool | Version | Check in PowerShell |
|------|---------|---------------------|
| Node.js (LTS) | 18 or newer | `node -v` |
| npm | comes with Node | `npm -v` |
| MySQL Community Server | 8.0 or newer (8.0.16+ is required for the CHECK constraints) | `mysql --version` |
| Visual Studio Code | any | |

* Node.js: download the LTS installer from <https://nodejs.org> and keep the default options.
* MySQL: download **MySQL Installer** from <https://dev.mysql.com/downloads/installer/>, choose **Server only** (or "Developer Default"), and set a **root password** when asked. **Remember it** – you need it in step 4.
  The installer registers MySQL as a Windows service that starts automatically.

Check that MySQL is running (PowerShell):

```powershell
Get-Service -Name "MySQL*"
```

The status should be `Running`. If it says `Stopped`, start it (PowerShell **as Administrator**), using the exact service name shown above (usually `MySQL80`):

```powershell
Start-Service MySQL80
```

---

## 2. Project layout

```
shopsphere/
  .env.example            # template for your settings (copy to .env)
  .gitignore
  README.md
  database/
    schema.sql            # creates the database + 5 tables
    seed.sql              # 21 sample products (no users)
  server/                 # Express REST API
    package.json
    scripts/              # setupEnv.js, initDb.js, createAdmin.js
    src/
      server.js  app.js
      config/             # env.js, db.js
      middleware/         # auth.js (JWT + roles), errorHandler.js
      routes/             # auth, products, cart, orders, admin
      controllers/        # the logic behind each route
      utils/              # validators, mappers, helpers
    tests/                # validators.test.js, api.test.js
  client/                 # React + Vite app
    package.json  vite.config.js  index.html
    public/               # product images (SVG), favicon
    src/
      components/  pages/  pages/admin/
      context/            # Auth, Cart, Toast state
      services/           # api.js (fetch wrapper), shop.js (all endpoints)
      hooks/  utils/  styles/
```

---

## 3. Open the project in VS Code

1. Unzip `shopsphere.zip` somewhere simple, e.g. `C:\Projects\shopsphere`.
2. VS Code → **File → Open Folder…** → choose the `shopsphere` folder.
3. Open a terminal: **Terminal → New Terminal** (PowerShell). You will use **two** terminals: one for the backend, one for the frontend.

If PowerShell refuses to run `npm` with a message about "running scripts is disabled", run this once and try again:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---

## 4. Backend setup (Terminal 1)

```powershell
cd server
npm install
npm run setup
```

`npm run setup` creates the file **`shopsphere/.env`** from `.env.example` and fills in a random `JWT_SECRET` for you.

Now **open `.env`** (in the project root, next to README.md) and set your MySQL password:

```
DB_USER=root
DB_PASSWORD=your_mysql_password_here
```

Leave `DB_NAME=shopsphere`, `PORT=5000` and `CLIENT_URL=http://localhost:5173` unchanged.
**Never share or commit `.env`** (it is already in `.gitignore`).

### Create the database, tables and sample products

```powershell
npm run db:init
```

This runs `database/schema.sql` (creates the `shopsphere` database and 5 tables) and then `database/seed.sql` (21 sample products with images).
It is safe to run again: it never deletes data. To wipe everything and start over: `npm run db:reset`.

*(Alternative: run the SQL files yourself in MySQL Workbench – open `database/schema.sql`, execute it, then open and execute `database/seed.sql`.)*

---

## 5. Create the first admin account (secure)

There is **no public admin registration**: everyone who signs up on the website is a normal `USER`.
The first admin is created from the command line, on your own computer:

```powershell
npm run create-admin
```

You will be asked for a name, an email and a password (typing is hidden, minimum 8 characters with letters and numbers).
Example for local development: email `admin@shopsphere.local`, and a password you choose yourself.

* If the email already exists as a normal account, that account is **promoted** to admin (its password is not changed).
* No default admin password exists anywhere in the project, so there is nothing for an attacker to guess.

---

## 6. Start the backend

Still in Terminal 1 (inside the `server` folder):

```powershell
npm run dev
```

You should see:

```
ShopSphere API running at http://localhost:5000/api
```

Check it in your browser: <http://localhost:5000/api/health> should show `"database":"connected"`.
Leave this terminal running.

---

## 7. Start the frontend (Terminal 2)

Open a second terminal (the **+** button in the terminal panel):

```powershell
cd client
npm install
npm run dev
```

Open **<http://localhost:5173>** in your browser. The React dev server forwards every `/api/...` call to the backend on port 5000, so there are no CORS problems.

---

## 8. Test the whole application

### As a customer
1. **Register** – click *Sign up*, create an account (try a weak password first to see the validation message, then a valid one).
2. **Log out and log in** again.
3. **Browse** – use the search bar, category chips and the *Sort by price* dropdown on the home page. Click a product for its details page.
4. **Cart** – add products, then open *Cart*: increase/decrease quantity, remove an item. Try to go above the stock level (e.g. "Vitamin C Face Serum" has only 3 in stock) – you get a message. "Scented Soy Candle" is out of stock.
5. **Persistence** – log out and log in again: your cart is still there (it is stored in MySQL).
6. **Checkout** – fill in name, phone and address, press *Place demo order*. You land on the confirmation page with an **order ID**. Stock is reduced.
7. **My Orders** – see the order, open its details and the progress tracker. A `PLACED` order can be cancelled (stock returns).

### As the admin
1. Log in with the admin account → an **Admin** link appears in the menu.
2. **Dashboard** – product/order/revenue cards, 7-day order chart, orders by status.
3. **Products** – *Add product*, *Edit*, *Delete* (a confirmation dialog appears before deleting).
4. **Orders** – change an order's status (PLACED → PROCESSING → SHIPPED → DELIVERED, or CANCELLED). Log in as the customer again and see the new status.
5. Log in as a normal customer and open <http://localhost:5173/admin> – you get "Access denied". The API also refuses admin calls from non-admins (HTTP 403).

### Automated tests (optional)

```powershell
cd server
npm test
```

* `validators.test.js` runs without a database.
* `api.test.js` needs MySQL and `npm run db:init` done first; it creates temporary users/products and deletes them afterwards. If the database is not reachable it is skipped with a message.

---

## 9. Requirements checklist (assignment → implementation)

| # | Requirement | Where it is implemented |
|---|-------------|-------------------------|
| 1 | Home page, navbar, search, category filters, product cards, footer | `pages/Home.jsx`, `components/Navbar.jsx`, `ProductCard.jsx`, `Footer.jsx` |
| 1 | Name, description, price, category, stock, rating on cards | `ProductCard.jsx`, `Stars.jsx`, `StockLabel.jsx` |
| 1 | Search, category filter, sort by price | `GET /api/products?search=&category=&sort=` → `productController.list` |
| 1 | Product details page | `pages/ProductDetails.jsx`, `GET /api/products/:id` |
| 1 | Responsive (desktop/tablet/mobile) | `styles/*.css` (breakpoints 960 / 900 / 800 / 700 / 560 px, mobile menu, tables become cards) |
| 2 | Register / login pages | `pages/Register.jsx`, `pages/Login.jsx` |
| 2 | bcrypt hashes, JWT | `authController.js` (bcryptjs, 10 rounds), `utils/token.js` |
| 2 | ADMIN / USER roles, admin-only routes | `users.role` ENUM, `middleware/auth.js` (`authenticate`, `requireAdmin`), `AdminRoute.jsx` |
| 2 | Users only see their own orders | `orderController.js` – every query filters `user_id`; others get 404 |
| 2 | Backend validation, `.env.example` | `utils/validators.js`, `.env.example` |
| 3 | Cart add / ± / remove / clear, totals | `pages/Cart.jsx`, `cartController.js`, `/api/cart` |
| 3 | Stock limits, empty-cart message | `cartController.assertStock`, `Cart.jsx` empty state |
| 3 | Cart persisted in DB | table `cart_items`, loaded by `CartContext.jsx` on login |
| 4 | Checkout form + summary, demo checkout | `pages/Checkout.jsx` (clearly labelled *Demo checkout*) |
| 4 | Server-side price/stock validation | `orderController.create` – prices read from `products`, client totals ignored |
| 4 | Transaction + safe stock reduction | `beginTransaction`, `SELECT … FOR UPDATE`, `UPDATE … WHERE stock >= ?`, rollback on error |
| 4 | Confirmation page with order ID | `pages/OrderConfirmation.jsx` |
| 5 | My Orders + details, 5 statuses | `pages/MyOrders.jsx`, `OrderDetails.jsx`, `orders.status` ENUM |
| 5 | Admin updates status | `PATCH /api/admin/orders/:id/status`, `pages/admin/AdminOrders.jsx` |
| 6 | Admin dashboard cards | `pages/admin/AdminDashboard.jsx`, `GET /api/admin/stats` |
| 6 | Product add / view / edit / delete | `pages/admin/AdminProducts.jsx`, `components/ProductForm.jsx` |
| 6 | Order management, empty states, confirmations | `AdminOrders.jsx`, `ConfirmDialog.jsx`, `EmptyState.jsx` |
| 7 | REST API with routes/controllers/middleware | `server/src/routes`, `controllers`, `middleware`, `middleware/errorHandler.js` |
| 8 | MySQL: users, products, cart_items, orders, order_items | `database/schema.sql` (PKs, FKs, indexes, DECIMAL money) |
| 8 | Seed data, safe first admin | `database/seed.sql`, `npm run create-admin` |
| 9 | Polished UI, loaders, toasts, accessible forms | `styles/`, `Loader.jsx`, `ToastContext.jsx`, labels + ARIA + keyboard-friendly dialogs |
| 10 | Project structure | see section 2 |
| 11 | Beginner README with PowerShell commands | this file |
| 12 | Tests / manual checklist | `server/tests/`, section 8 |

### API summary

| Method & path | Who | Purpose |
|---------------|-----|---------|
| `POST /api/auth/register` | public | create a USER account |
| `POST /api/auth/login` | public | get a JWT |
| `GET /api/auth/me` | logged in | current user |
| `GET /api/products`, `/categories`, `/:id` | public | catalog |
| `POST/PUT/DELETE /api/products[/:id]` | ADMIN | manage products |
| `GET /api/cart`, `POST /api/cart`, `PUT/DELETE /api/cart/:productId`, `DELETE /api/cart` | logged in | cart |
| `POST /api/orders`, `GET /api/orders`, `GET /api/orders/:id`, `POST /api/orders/:id/cancel` | logged in (own orders) | checkout & tracking |
| `GET /api/admin/stats`, `GET /api/admin/orders[/:id]`, `PATCH /api/admin/orders/:id/status` | ADMIN | dashboard & order management |

All responses use the shape `{ "success": true, "data": … }` or `{ "success": false, "message": "…", "errors": { field: "…" } }`.

### Design decisions worth mentioning in your viva
* **Money** is `DECIMAL(10,2)` in MySQL and calculated in whole cents in code (no floating-point errors).
* **Order items copy the product name and unit price**, so old orders stay correct if a product is edited or deleted.
* **Cancelling** an order (by the customer while `PLACED`, or by an admin) returns the stock inside a transaction; a cancelled order cannot be re-opened.
* **Tokens** are validated against the database on every request, so a deleted user is rejected immediately and role changes apply at once.
* Currency is shown as INR (₹); change `CURRENCY`/`LOCALE` in `client/src/utils/format.js` to use another.

---

## 10. Troubleshooting

| Problem | Fix |
|---------|-----|
| `JWT_SECRET is missing…` when starting the server | Run `npm run setup` in `server` (or copy `.env.example` to `.env` and fill `JWT_SECRET`). |
| `Access denied for user 'root'` | `DB_PASSWORD` in `.env` is wrong. |
| `ECONNREFUSED … 3306` | MySQL is not running – `Start-Service MySQL80` (admin PowerShell). |
| `Table … doesn't exist` | Run `npm run db:init`. |
| Browser shows "Cannot reach the server" | Terminal 1 (`npm run dev` in `server`) is not running, or port 5000 is busy – change `PORT` in `.env` **and** `VITE_PROXY_TARGET` in `client/.env`. |
| Port 5173 already in use | Close the other Vite window; the app is configured to need exactly 5173 (it must match `CLIENT_URL`). |
| Forgot the admin password | Run `npm run db:reset` (wipes data) or create another admin with `npm run create-admin` using a different email. |
| Edited `.env` but nothing changed | Stop the backend (Ctrl+C) and run `npm run dev` again. |

---

*ShopSphere is a college demo project. The checkout does not process real payments.*
