# Workout Tracker API

A RESTful backend system for a workout tracker application, featuring JWT authentication, exercise data management, workout scheduling, and progress reporting.

## Overview

This project provides a robust API for users to manage their fitness routines. It relies on a relational database to store user accounts, a pre-seeded library of exercises, and personalized workout plans. The system ensures that users can securely authenticate, build custom workouts with specific sets and reps, schedule them, and generate reports on their past progress.

## Features

- **User Authentication** — Secure sign-up, login, and authorization using JSON Web Tokens (JWT). Users can only access their own data.
- **Exercise Database** — A seeded database of exercises categorized by type (e.g., cardio, strength) and muscle group.
- **Workout Management** — Full CRUD (Create, Read, Update, Delete) capabilities for workout plans consisting of multiple exercises, sets, repetitions, and weights.
- **Scheduling** — Ability to schedule workouts for specific future dates and times.
- **Progress Reporting** — Generate reports summarizing past workouts and fitness progress.

## Requirements

- Node.js 16 or later (or your preferred backend language/framework)
- A Relational Database (e.g., PostgreSQL or MySQL)

## Install

From the `projects/19-workout-tracker-api` directory:

```bash
npm install

```

## Configuration

Create a `.env` file to store your database credentials and secrets:

```env
PORT=3000
DATABASE_URL=your_relational_database_url
JWT_SECRET=your_jwt_secret_key

```

## Run

Start the API server:

```bash
npm start

```

*(You can use tools like Postman or Insomnia to interact with the endpoints and test the JWT authorization flow).*

## Project URL

* https://roadmap.sh/projects/fitness-workout-tracker
