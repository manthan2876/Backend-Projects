# Blogging Platform API

A headless blog backend REST API built with Node.js and MongoDB.

## Overview

This project exposes blog post REST endpoints for creating, reading, updating, and deleting posts. It uses a local MongoDB database as the storage backend.

## Features

- `GET /posts` - list all posts
- `GET /posts?category=<category>` - filter posts by category
- `GET /posts?term=<query>` - search posts by title or content
- `POST /posts` - create a new post
- `GET /posts/:id` - get a single post by ID
- `PUT /posts/:id` - update an existing post
- `DELETE /posts/:id` - delete a post

## Requirements

- Node.js 16 or later
- Local MongoDB instance running on `mongodb://127.0.0.1:27017`

## Install

From the `projects/08-blogging-plateform-api` directory:

```bash
npm install
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

Create a post:
```bash
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Hello Blog","content":"This is a sample post.","category":"General"}'
```

Get all posts:
```bash
curl http://localhost:3000/posts
```

Update a post:
```bash
curl -X PUT http://localhost:3000/posts/1234567890 \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Title"}'
```

Delete a post:
```bash
curl -X DELETE http://localhost:3000/posts/1234567890
```

## Project URL

- https://roadmap.sh/projects/blogging-platform-api
