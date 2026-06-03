# Weather API Wrapper Service

A simple Node.js backend that proxies weather data from OpenWeatherMap and caches responses.

## Overview

This project exposes a `/weather` HTTP endpoint that accepts a `city` query parameter, fetches weather data from a third-party API, and returns JSON output. Responses are cached in memory for 12 hours to reduce repeated external API calls.

## Features

- GET `/weather?city=<city name>` endpoint
- In-memory caching for 12 hours
- Proxy to OpenWeatherMap API
- JSON error responses for missing parameters or upstream failures

## Requirements

- Node.js 16 or later
- OpenWeatherMap API key

## Install

From the `projects/07-weather-api` directory:

```bash
npm install
```

## Configuration

Create a `.env` file with the following value:

```env
WEATHER_API_KEY=your_openweathermap_api_key
```

## Run

```bash
npm start
```

Then make requests like:

```bash
curl "http://localhost:3000/weather?city=London"
```

## Project URL

- https://roadmap.sh/projects/weather-api-wrapper-service
