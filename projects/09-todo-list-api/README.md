# Todo List API

A secure, multi-tenant Todo List REST API built with Node.js, MongoDB, and JSON Web Tokens (JWT).

## Overview

This project implements user registration and login with JWT-based authentication, plus CRUD endpoints for managing per-user todo items. Data is stored in a MongoDB database.

## Features

- User registration (`POST /register`) and login (`POST /login`) with password hashing and JWT issuance
- Protected todo endpoints requiring `Authorization: Bearer <token>`
  - `GET /todos` - list authenticated user's todos
  - `POST /todos` - create a new todo
  - `PUT /todos/:id` - update a todo
  - `DELETE /todos/:id` - delete a todo
- MongoDB-backed persistence

## Requirements

- Node.js 16 or later
- Local or remote MongoDB instance

## Install

From the `projects/09-todo-list-api` directory:

```bash
npm install
```

## Configuration

Create a `.env` file with the following variables:

```env
MONGO_URI=mongodb://127.0.0.1:27017
JWT_SECRET=your_jwt_secret
```

## Run

```bash
npm start
```

The API listens on:

```text
http://localhost:3000
```

## Example Requests

Register a user:

```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"s3cr3t"}'
```

Login to receive a JWT:

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"s3cr3t"}'
```

Use the returned token for authenticated requests:

```bash
TOKEN=eyJhbGciOiJI...yourtoken
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/todos
```

Create a todo:

```bash
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Buy milk","description":"2 liters"}'
```

## Project URL

- https://roadmap.sh/projects/todo-list-api
