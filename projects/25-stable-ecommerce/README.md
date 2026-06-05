# Scalable E-Commerce Platform

A scalable, distributed e-commerce backend platform designed using a microservices architecture. It includes distinct node-based services that communicate over local REST channels, domain-isolated database structures, and a persistent invoice worker filesystem. The entire platform is containerized and orchestrated using Docker and Docker Compose.

Roadmap.sh Project Details: [Scalable E-Commerce Platform](https://roadmap.sh/projects/scalable-ecommerce-platform)

---

## Architecture Overview

The system consists of the following components:

```
                  ┌──────────────────────┐
                  │   Client / Postman   │
                  └──────────┬───────────┘
                             │
            ┌────────────────┴────────────────┐
     POST   │                                 │ POST
/checkout   ▼                                 ▼ /products
     ┌──────────────┐                  ┌──────────────┐
     │Order Service │                  │Product Catal.│
     │  (Port 3000) │                  │  (Port 3001) │
     └──────┬───────┘                  └──────┬───────┘
            │                                 │
            │ 1. Validate & Reserve Stock     │
            ├────────────────────────────────►│ Connects to:
            │                                 │ mongodb://mongo-db:27017/shop_products
            │                                 └──────┬───────
            │ 2. Trigger Invoice (Async)             │
            ├─────────────────────┐                  │
            │                     │                  ▼
            ▼                     ▼            ┌─────────────┐
     Connects to:          ┌──────────────┐    │  MongoDB    │
     mongodb://mongo-db:   │Notification  │    │  Database   │
     27017/shop_orders     │ (Port 3002)  ├───►│  Container  │
                           └──────┬───────┘    └─────────────┘
                                  │ Writes to:
                                  ▼
                            ┌───────────┐
                            │ /invoices │ (Persistent Named Volume)
                            └───────────┘
```

### 1. Product Catalog Service (Port 3001)
- Manages product listings, pricing, and stock details.
- Handles inventory reservation and deduction operations under lock conditions requested by the Order Service.
- Connects to database: `shop_products`.

### 2. Order Service (Port 3000)
- Manages order checkout endpoints (`POST /checkout`).
- Coordinates with the Product Service to validate and reserve items.
- Automatically calculates reconciliation value and writes transaction records to database: `shop_orders`.
- Dispatches async non-blocking task calls to the Notification Service.

### 3. Notification Service (Port 3002)
- Simulates out-of-band processing queue events.
- Writes commercial invoice records in plain text to a shared volume directory (`/invoices`).

### 4. MongoDB Database Container (Port 27018 on Host / 27017 in Container)
- Decentralized MongoDB daemon instances running in isolated database tables `shop_products` and `shop_orders`.
- Binds to host port `27018` to prevent conflict with local Windows MongoDB service instances.

---

## Getting Started

### Prerequisites
- Docker & Docker Compose installed.
- MongoDB Compass (optional, for DB verification).

### Run in Docker

Run the build and startup sequence:
```bash
docker compose up --build
```
To run the containers in detached (background) mode:
```bash
docker compose up -d --build
```

---

## API Endpoints & Testing Loop

Here is the step-by-step verification process:

### Step 1: Seed items into the Product Catalog
Create inventory products inside the database.

- **Method**: `POST`
- **URL**: `http://localhost:3001/products`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
    "name": "Mechanical Keyboard",
    "price": 89.99,
    "stockQuantity": 15
}
```
- **Response** (`201 Created`):
```json
{
    "name": "Mechanical Keyboard",
    "price": 89.99,
    "stockQuantity": 15,
    "_id": "6a22c29bc4d733908c091bb5",
    "__v": 0
}
```
*Action: Copy the `_id` field from the response.*

---

### Step 2: Trigger Distributed Checkout
Place a purchase request directly to the Order Checkout Gateway.

- **Method**: `POST`
- **URL**: `http://localhost:3000/checkout`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
    "items": [
        {
            "productId": "PASTE_YOUR_COPIED_PRODUCT_ID_HERE",
            "qty": 2
        }
    ]
}
```
- **Response** (`202 Accepted`):
```json
{
    "message": "Order placed successfully. Processing receipt asynchronously.",
    "orderReferenceId": "6a22c2a2bedd3c5d3a1d3a7b",
    "totalReconciliationValue": 179.98
}
```

---

### Step 3: Verify Invoice Generation
The notification service runs asynchronously in the background.

1. Check notification service logs to confirm worker processed the receipt:
   ```bash
   docker logs 25-stable-ecommerce-notification-service-1
   ```
2. Verify the plain text commercial invoice file inside the persistent shared volume:
   ```bash
   docker exec 25-stable-ecommerce-notification-service-1 cat /invoices/invoice-PASTE_ORDER_REFERENCE_ID_HERE.txt
   ```
   **Output:**
   ```
   ========================================
   COMMERCIAL INVOICE TRANSACTION RECORD
   ========================================
   Order Reference Token: 6a22c2a2bedd3c5d3a1d3a7b
   Reconciliation Value: $179.98
   Manifest entries:
    - Mechanical Keyboard (Qty: 2)
   ========================================
   ```

---

## Database Inspection (MongoDB Compass)

To access and view the documents inside MongoDB Compass:
1. Open MongoDB Compass.
2. Connect using the Connection URI:
   ```text
   mongodb://localhost:27018
   ```
   *(Note: The host port `27018` maps directly to port `27017` inside the MongoDB container, avoiding any Windows host service conflicts).*
3. You will see the databases `shop_products` (with collection `products`) and `shop_orders` (with collection `orders`) inside Compass. Remember to click **Refresh** in Compass to reload the database list.
