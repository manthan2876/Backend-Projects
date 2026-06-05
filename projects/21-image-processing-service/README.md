# Image Processing Service API

A RESTful backend system similar to Cloudinary, allowing users to securely upload, transform, and manage images using Node.js and AWS S3.

## Overview

This project provides an end-to-end API for managing image assets. It handles secure user authentication via JWTs and allows users to upload images directly to cloud storage (AWS S3). Once uploaded, users can request various on-the-fly transformations—such as resizing, cropping, rotating, and applying filters—before retrieving the processed images. 

## Features

- **User Authentication** — Secure sign-up, login, and protected routes using JSON Web Tokens (JWT).
- **Cloud Storage** — Direct integration with AWS S3 for scalable and reliable image hosting.
- **Image Upload & Retrieval** — Endpoints to upload raw images via multipart form-data and retrieve them by ID.
- **Image Transformation** — Apply powerful transformations including:
  - Resize & Crop
  - Rotate, Flip & Mirror
  - Format conversion (JPEG, PNG, WebP, etc.)
  - Filters (Grayscale, Sepia)
- **Image Metadata** — View a paginated list of all uploaded images and their associated metadata.

## Requirements

- Node.js 16 or later
- An AWS Account with an S3 Bucket configured
- A Database (e.g., PostgreSQL or MongoDB for user/metadata storage)
- An image processing library (e.g., `sharp` for Node.js)

## Install

From the `projects/20-image-processing-service` directory:

```bash
npm install

```

## Configuration

Create a `.env` file to store your database, JWT, and AWS credentials:

```env
PORT=3000
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret_key

# AWS S3 Configuration
AWS_REGION=your_aws_region
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
S3_BUCKET_NAME=your_s3_bucket_name

```

## Run

Start the API server:

```bash
npm start

```

*(You can test the endpoints by sending multipart form-data requests via Postman or Insomnia).*

## Project URL

* https://roadmap.sh/projects/image-processing-service