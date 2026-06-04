# Multi-Container Application

A Dockerized Node.js API and MongoDB database setup using Docker Compose, provisioned via Terraform and configured with Ansible, complete with a CI/CD deployment pipeline.

## Overview

This project demonstrates how to package and run a multi-container application in production. It features a Node.js REST API for managing a simple Todo list, connected to a MongoDB database. The entire environment is managed via `docker-compose`, ensuring data persistence and seamless communication between services. It also includes infrastructure-as-code (IaC) and automation scripts for remote server deployment.

## Features

- **Todo REST API** — Unauthenticated endpoints to create, read, update, and delete (CRUD) todo items.
  - `GET /todos` — Get all todos
  - `POST /todos` — Create a new todo
  - `GET /todos/:id` — Get a single todo
  - `PUT /todos/:id` — Update a single todo
  - `DELETE /todos/:id` — Delete a single todo
- **Docker Compose Setup** — Spins up both the API and MongoDB containers simultaneously, with volume mapping for database persistence.
- **Infrastructure as Code** — Uses Terraform to provision a remote cloud server.
- **Configuration Management** — Uses Ansible to install Docker, Docker Compose, and configure the remote server.
- **CI/CD Pipeline** — Uses GitHub Actions to automatically deploy the containers to the remote server on code push.
- **Nginx Reverse Proxy** *(Bonus)* — Configured via Docker Compose to route traffic from a domain name (port 80/443) to the API container.

## Requirements

- Docker & Docker Compose
- Node.js 16 or later (for local development)
- Terraform
- Ansible
- A Cloud Provider account (e.g., AWS, DigitalOcean)

## Install

From the `projects/17-multi-container-service` directory, install the local dependencies for the API:

```bash
npm install

```

## Run Locally

Start the multi-container environment using Docker Compose:

```bash
docker-compose up -d

```

*(The API will be accessible at `http://localhost:3000` and will automatically connect to the MongoDB container).*

To stop the containers while preserving database volumes:

```bash
docker-compose down

```

## Project URL

* https://roadmap.sh/projects/multi-container-service
