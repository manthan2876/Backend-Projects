# Database Backup CLI

A powerful command-line interface utility designed to automate database backups, compress files, and securely store them locally or in the cloud using Node.js.

## Overview

This project provides a robust, scriptable tool for database administrators and developers to manage backups. It connects to databases (with a focus on MongoDB), validates credentials, exports the data, compresses it to save space, and offers seamless integration to push the archived backups directly to an AWS S3 bucket. It also includes logging and restore capabilities.

## Features

- **Database Connectivity** — Connects to and tests credentials for databases (e.g., MongoDB via URI).
- **Automated Backups** — Executes secure data dumps and compresses the output (e.g., into `.tar.gz` or `.zip`).
- **Cloud Storage** — Native integration with AWS S3 for secure, off-site backup storage.
- **Restore Operations** — Easily fetch and restore a database from a previous local or cloud backup file.
- **Logging & Notifications** — Tracks backup start/end times, durations, and errors, with optional Slack webhook notifications upon completion.

## Requirements

- Node.js 16 or later
- MongoDB Database (and appropriate CLI tools like `mongodump`/`mongorestore` installed in your environment)
- An AWS Account with an S3 Bucket configured

## Install

From the `projects/23-database-backup-cli` directory:

```bash
npm install

```

*(Note: You may want to run `npm link` to execute your tool globally from the command line).*

## Configuration

Create a `.env` file to securely store your cloud and notification credentials:

```env
MONGO_URI=YOU_MONGO_URI_HERE
AWS_BUCKET_NAME=YOUR_BUCKET_NAME_HERE
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_HERE
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY_HERE
AWS_REGION=YOUR_AWS_REGION_HERE

```

## Run

Run the tool to execute a backup directly to S3:

```bash
node index.js --action backup --type mongodb --uri "mongodb://localhost:27017/my_database"
```

To restore from a specific backup file:

```bash
node index.js --action restore --type mongodb --uri "mongodb://localhost:27017/my_database" --file "./backups/YOUR_NEW_my_database_BACKUP.json.gz"
```

## Project URL

* https://roadmap.sh/projects/database-backup-utility