# GitHub Trending CLI

A command-line tool to discover trending GitHub repositories based on time periods and custom limits.

## Overview

This CLI queries the GitHub Search API to find trending repositories created within a specified time frame. Results are sorted by star count and displayed with repository name, language, description, and star count.

## Features

- Filter trending repositories by time period: `day`, `week`, `month`, `year`
- Customize the number of results to display
- Display star count, language, and description for each repository
- Built-in error handling for GitHub API rate limits

## Requirements

- Node.js 16 or later

## Install

From the `projects/11-gtihub-trending-cli` directory:

```bash
npm install
```

## Run

```bash
npm start -- --duration week --limit 10
```

## Options

- `--duration <period>` - Time period to search: `day`, `week` (default), `month`, `year`
- `--limit <number>` - Maximum number of results to display (default: 10)

## Examples

Show top 5 repositories trending in the past day:

```bash
npm start -- --duration day --limit 5
```

Show top 20 repositories trending in the past month:

```bash
npm start -- --duration month --limit 20
```

Show top 10 repositories trending in the past year (default limit):

```bash
npm start -- --duration year
```

## Project URL

- https://roadmap.sh/projects/github-trending-cli
