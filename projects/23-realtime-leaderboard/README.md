# Real-Time Leaderboard API

A high-performance backend system for managing real-time gaming leaderboards using Node.js and Redis Sorted Sets.

## Overview

This project implements a scalable leaderboard service capable of handling high-frequency score updates and rank queries. By leveraging the power of Redis Sorted Sets, the system efficiently maintains player rankings in real-time across various games or activities. It includes JWT-based user authentication, score tracking, and historical reporting.

## Features

- **User Authentication** — Secure registration and login functionality using JSON Web Tokens (JWT).
- **Score Submission** — Endpoints for authenticated users to submit and update their scores for specific games.
- **Real-Time Leaderboards** — Instantaneous global and game-specific leaderboard updates powered by Redis Sorted Sets (`ZADD`, `ZREVRANGE`).
- **User Rankings** — Efficient rank queries allowing users to instantly check their exact position on the leaderboard (`ZREVRANK`).
- **Top Players Report** — Generate reports highlighting the top-performing players over specific time periods.

## Requirements

- Node.js 16 or later
- Docker (to run the Redis container)

## Install

From the `projects/22-realtime-leaderboard-system` directory:

```bash
npm install

```

## Configuration

Create a `.env` file to store your environment variables:

```env
REDIS_URI=YOUR_REDIS_URI_HERE
PORT=3000

```

## Run

First, start your Redis instance using Docker:

```bash
docker run --name redis-leaderboard -p 6379:6379 -d redis

```

Then, start the API server:

```bash
npm start

```

*(You can test the score submissions and leaderboard queries using Postman or Insomnia).*

## Project URL

* https://roadmap.sh/projects/realtime-leaderboard-system