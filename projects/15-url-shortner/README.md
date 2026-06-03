# URL Shortener API

A RESTful API service that allows users to create, retrieve, update, and delete shortened URLs, complete with access statistics tracking.

## Overview

This backend project implements a core URL shortening service. It takes a standard, long URL and generates a unique, shortened code. It also tracks the number of times the shortened URL is accessed and allows for full CRUD (Create, Read, Update, Delete) operations on the URL records.

## Features

- **Create Short URL** — `POST /shorten` to generate a unique short code for a long URL.
- **Retrieve Original URL** — `GET /shorten/:shortCode` to fetch the original URL for redirection.
- **Update Short URL** — `PUT /shorten/:shortCode` to update the destination of an existing short code.
- **Delete Short URL** — `DELETE /shorten/:shortCode` to remove a short URL from the system.
- **Get URL Statistics** — `GET /shorten/:shortCode/stats` to view how many times the short URL has been accessed.

## Requirements

- Node.js 16+ (or your preferred backend language/framework like Python/Flask, Java/Spring Boot)
- A Database (e.g., PostgreSQL, MySQL, or MongoDB)

## Install

From the `projects/15-url-shortening-api` directory:

```bash
npm install

```

## Run

Start the API server:

```bash
npm start

```

*(Once running, you can use a tool like Postman or `curl` to interact with the endpoints).*

## Project URL

* https://roadmap.sh/projects/url-shortening-service
