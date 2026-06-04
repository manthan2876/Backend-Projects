# E-Commerce API

A comprehensive RESTful API for an e-commerce platform, featuring user authentication, cart management, role-based access control, and payment gateway integration.

## Overview

This logic-heavy backend project demonstrates how to handle complex data models and external service integrations. It includes a complete flow for an online store: from users browsing and searching for products, to adding them to a shopping cart, and finally checking out using a secure payment integration (like Stripe). It also features an admin panel for inventory and pricing management.

## Features

- **User Authentication** — Secure sign-up and log-in functionality using JWT.
- **Product Catalog** — Endpoints to view, search, and filter available products.
- **Shopping Cart** — Ability for authenticated users to add, update, and remove products from their active cart.
- **Checkout & Payments** — Integration with Stripe (or similar external payment gateways) to process user payments securely.
- **Admin Management** — Role-based access endpoints allowing admins to add/edit products, set prices, and manage inventory.

## Requirements

- Node.js 16 or later (or your preferred backend language/framework)
- A Database (e.g., PostgreSQL, MongoDB, or MySQL)
- Stripe API Keys (for testing payments)

## Install

From the `projects/18-ecommerce-api` directory:

```bash
npm install

```

## Configuration

Create a `.env` file to store your secrets:

```env
PORT=3000
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_jwt_secret_key
STRIPE_SECRET_KEY=your_stripe_test_key

```

## Run

Start the API server:

```bash
npm start

```

*(Once running, use Postman, Insomnia, or a simple frontend template to interact with the endpoints).*

## Project URL

* https://roadmap.sh/projects/ecommerce-api
