# Task Tracker

Task Tracker is a Node.js backend CLI application for managing tasks from the command line.

Project URL: https://roadmap.sh/projects/task-tracker

## Key Features

- Create, list, update, and delete tasks
- Store tasks in a local JSON file
- Simple command-line interface
- Easy to inspect and extend

## Prerequisites

- Node.js v18+
- Git (optional, for cloning)

## Installation

```bash
cd projects/01-task-tracker
npm install
```

## Usage

Run the app with Node:

```bash
node index.js list
node index.js add "Buy groceries"
node index.js update 1780391172694 --done
node index.js delete 1780391172694
```

## Configuration

No environment variables are required for this project.

The task data is stored in `tasks.json` in the same folder.

## Contribution

If you want to improve this project:

1. Fork the repository.
2. Create a feature branch.
3. Submit a pull request with details.

Issues and pull requests should describe the bug or enhancement clearly.

## License

No license is specified for this repository. If you want to use or share this code, please add a license file or contact the author.

## Monorepo Link

Back to the repository overview:

[Backend Projects root README](../../README.md)

