# InventoryPro — Inventory & Order Management System

A production-ready, full-stack Inventory & Order Management System built with **FastAPI**, **React**, **PostgreSQL**, and **Docker**.

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Backend   | Python · FastAPI · SQLAlchemy       |
| Frontend  | React 18 · Vite · Tailwind CSS      |
| Database  | PostgreSQL 16                       |
| Container | Docker · Docker Compose             |
| Proxy     | Nginx (inside frontend container)   |

---

## Features

- **Products** — CRUD with unique SKU enforcement, stock tracking, low-stock alerts
- **Customers** — CRUD with unique email enforcement
- **Orders** — Multi-item orders, automatic stock deduction, insufficient-stock guard, status management, stock restoration on delete
- **Dashboard** — Live stats: revenue, order counts, low-stock alerts, pending orders
- Business rules enforced at the API level (not just the UI)

---

## Quick Start (Docker)

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd inventory-system

# 2. Copy and configure environment
cp .env.example .env
# Edit .env — change POSTGRES_PASSWORD at minimum

# 3. Build and start everything
docker compose up --build -d

# 4. Open the app
open http://localhost        # Frontend
open http://localhost:8000/docs  # Swagger API docs
```

---

## Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/inventory"
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install

# Point to local backend
echo "VITE_API_URL=http://localhost:8000" > .env.local

npm run dev    # Starts on http://localhost:3000
```

---

## API Endpoints

### Products
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/products/` | List all products |
| POST   | `/products/` | Create product (unique SKU required) |
| GET    | `/products/{id}` | Get single product |
| PUT    | `/products/{id}` | Update product |
| DELETE | `/products/{id}` | Delete product |

### Customers
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/customers/` | List all customers |
| POST   | `/customers/` | Create customer (unique email required) |
| GET    | `/customers/{id}` | Get single customer |
| PUT    | `/customers/{id}` | Update customer |
| DELETE | `/customers/{id}` | Delete customer |

### Orders
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/orders/` | List all orders |
| POST   | `/orders/` | Create order (validates stock for all items first) |
| GET    | `/orders/{id}` | Get order with items |
| PUT    | `/orders/{id}/status` | Update order status |
| DELETE | `/orders/{id}` | Delete order & restore stock |

### Other
| Method | Path | Description |
|--------|------|-------------|
| GET    | `/health` | Health check |
| GET    | `/dashboard/stats` | Aggregated stats |

Full interactive docs available at `/docs` (Swagger UI) and `/redoc`.

---

## Business Rules

1. **Unique SKU** — Creating or updating a product with a duplicate SKU returns HTTP 400
2. **Unique Email** — Customers must have unique email addresses
3. **Stock validation** — All items in an order are validated *before* any stock is deducted; if any item lacks sufficient stock, the entire order is rejected with a descriptive error
4. **Automatic stock deduction** — On order creation, `stock_quantity` is decremented for each product
5. **Stock restoration** — Deleting an order restores stock for all its items
6. **Non-negative values** — Price and stock quantity are validated to be ≥ 0

---

## Deployment

### Free Hosting Options

#### Backend → Render
1. Push code to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add `DATABASE_URL` environment variable (use Render's free PostgreSQL)

#### Frontend → Vercel / Netlify
1. Push to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Set `VITE_API_URL` to your Render backend URL
4. Framework preset: **Vite**

#### Docker Hub
```bash
# Build and push images
docker build -t yourdockerhub/inventorypro-backend:latest ./backend
docker build -t yourdockerhub/inventorypro-frontend:latest ./frontend
docker push yourdockerhub/inventorypro-backend:latest
docker push yourdockerhub/inventorypro-frontend:latest
```

---

## Project Structure

```
inventory-system/
├── backend/
│   ├── main.py          # FastAPI app + all routes
│   ├── models.py        # SQLAlchemy ORM models
│   ├── schemas.py       # Pydantic request/response schemas
│   ├── crud.py          # Database operations
│   ├── database.py      # DB connection
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/client.js        # Axios API layer
│   │   ├── components/          # Modal, Sidebar, StatusBadge, etc.
│   │   ├── pages/               # Dashboard, Products, Customers, Orders
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `postgres` | DB username |
| `POSTGRES_PASSWORD` | `postgres` | DB password — **change in production** |
| `POSTGRES_DB` | `inventory` | Database name |
| `DATABASE_URL` | auto | Full connection string (constructed by compose) |
| `VITE_API_URL` | `/api` | Frontend API base URL |
