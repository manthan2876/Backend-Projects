# Markdown Note-Taking API

A RESTful API service that allows users to upload, save, grammar-check, and render Markdown files into HTML.

## Overview

This backend project provides endpoints to manage text-based notes. It is designed to demonstrate how to handle file uploads in a RESTful API, parse and render Markdown content on the server using libraries, and integrate grammar-checking functionality. 

## Features

- **Grammar Check** — Endpoint to verify the grammar of a submitted note.
- **Save Note** — Endpoint to upload and save Markdown text as a file.
- **List Notes** — Endpoint to retrieve a list of all saved Markdown files.
- **Render HTML** — Endpoint to fetch a saved Markdown note converted into readable HTML format.

## Requirements

- Node.js 16 or later

## Install

From the `projects/14-markdown-note-taking-app` directory:

```bash
npm install

```

## Run

Start the API server:

```bash
npm start

```

*(Once the server is running, you can use tools like Postman, Insomnia, or `curl` to send requests to the various endpoints).*

## Project URL

* https://roadmap.sh/projects/markdown-note-taking-app
