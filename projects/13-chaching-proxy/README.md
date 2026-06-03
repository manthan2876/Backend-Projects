# Caching Proxy Server CLI

A command-line interface tool that starts a caching proxy server to forward requests and cache responses.

## Overview

This CLI tool forwards HTTP requests to an actual origin server and caches the responses. If the exact same request is made again, it returns the cached response instead of hitting the origin server, greatly improving performance and reducing network load. It also attaches custom headers to let you know if the response was served from the cache or the origin.

## Features

* Starts a local server on a customized port.
* Forwards requests to any specified origin URL.
* Caches responses to avoid redundant network calls on identical requests.
* Indicates cache status via custom HTTP headers:
* `X-Cache: HIT` (response served from the local cache)
* `X-Cache: MISS` (response fetched from the origin server)


* `clear-cache` — a dedicated command to flush the cached data.

## Requirements

* Node.js 16 or later

## Install

From your project directory:

```bash
npm install

```

*(Note: You may need to run `npm link` to map the `caching-proxy` command globally on your system, depending on how your package.json is configured).*

## Run

Start the caching proxy server by defining a port and an origin URL:

```bash
caching-proxy --port 3000 --origin http://dummyjson.com

```

Once running, you can test it by making a request to your local server:

```bash
curl -i http://localhost:3000/products

```

To clear the cache, stop the server and run:

```bash
caching-proxy --clear-cache

```

## Project URL

* [https://roadmap.sh/projects/caching-server](https://roadmap.sh/projects/caching-server)