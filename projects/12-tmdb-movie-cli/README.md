# TMDB Movie CLI

A command-line interface for searching and discovering movies via The Movie Database (TMDB) API.

## Overview

This CLI tool fetches movie data from TMDB using an API key. It supports listing now playing movies, popular titles, and searching for movies by keyword.

## Features

- `playing` — list movies currently in theaters
- `popular` — list popular movies
- `search <query>` — search TMDB for movies by title
- Displays movie title, release date, rating, and overview

## Requirements

- Node.js 16 or later
- A TMDB API key

## Install

From the `projects/12-tmdb-movie-cli` directory:

```bash
npm install
```

## Configuration

Create a `.env` file with this value:

```env
TMDB_API_KEY=your_tmdb_api_key
```

## Run

```bash
npm start -- playing
```

Or use other commands:

```bash
npm start -- popular
npm start -- search "Inception"
```

## Project URL

- https://roadmap.sh/projects/tmdb-cli
