# Movie Reservation API

A RESTful backend system for a movie theater booking service, featuring role-based access control, showtime scheduling, and race-condition safe seat reservations using Node.js and MongoDB.

## Overview

This project implements complex business logic surrounding seat availability, scheduling, and transaction safety. It supports dual user roles: regular users who can browse movies by date, check real-time seat availability maps, and reserve/cancel seats; and admins who hold exclusive permissions to manage the movie catalog, configure showtimes, and view theater capacities alongside revenue reports.

## Features

- **Role-Based Authentication** — Secure registration and login using JWT, distinguishing between standard customers and administrative accounts.
- **Movie & Showtime Catalog** — Administrative CRUD operations for movies (title, description, poster, genre) and scheduling their exact showtimes.
- **Seat Map & Reservations** — Real-time tracking of seat availability per showtime with validation logic to prevent double-booking.
- **Reservation Management** — Allows users to view their active booking history and cancel upcoming reservations.
- **Admin Metrics Reporting** — Dashboard endpoints summarizing total reservations, theater occupancy percentages, and generated revenue.

## Requirements

- Node.js 16 or later
- MongoDB (Local instance or Atlas cloud cluster)
- MongoDB Compass (Recommended for database GUI inspection)

## Install

From the `projects/21-movie-reservation-api` directory:

```bash
npm install

```

## Configuration

Create a `.env` file to store your environment variables:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/movie_reservation_db
JWT_SECRET=your_jwt_secret_key

```

## Run

Start the API server:

```bash
npm start

```

*(You can test the reservation flows and role validations using Postman or Insomnia by modifying the authorization header token).*

## Project URL

* https://roadmap.sh/projects/movie-reservation-system