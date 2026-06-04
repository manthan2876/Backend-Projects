# Broadcast Server CLI

A command-line interface tool to start a real-time WebSocket broadcast server or connect to it as a messaging client.

## Overview

This project demonstrates how to work with WebSockets to implement real-time, bi-directional communication between clients and a server. It features a CLI application that can operate in two modes: a server that listens for and broadcasts messages, and a client that connects to the server to send and receive messages.

## Features

- **Start Server** — `broadcast-server start` to initialize the WebSocket server on a specified port.
- **Connect Client** — `broadcast-server connect` to join the server and enter the real-time chat.
- **Message Broadcasting** — Any message sent by a connected client is instantly broadcasted to all other connected clients.
- **Connection Management** — Gracefully handles multiple clients connecting and disconnecting without crashing the server.

## Requirements

- Node.js 16 or later (or your preferred backend language/framework)
- A WebSocket library (e.g., `ws` for Node.js)

## Install

From the `projects/16-broadcast-server` directory:

```bash
npm install

```

*(Note: You may need to run `npm link` to map the `broadcast-server` command globally on your system, depending on how your package.json is configured).*

## Run

To start the server:

```bash
broadcast-server start

```

*(You can optionally configure a port via flags if implemented, e.g., `--port 8080`)*

To connect to the server as a client (open this in a separate terminal window):

```bash
broadcast-server connect

```

## Project URL

* https://roadmap.sh/projects/broadcast-server
