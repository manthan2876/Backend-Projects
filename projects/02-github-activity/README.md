# GitHub User Activity

A small CLI utility that fetches a user's recent public GitHub events and prints a compact activity summary.

Project URL: https://roadmap.sh/projects/github-user-activity

## Key Features

- Prints human-readable activity lines for recent events
- Supports Push, Issues, Watch (star), Pull Request, Create, and Issue Comment events
- Uses the GitHub public events API (no auth required for public data)

## Prerequisites

- Node.js v18+

## Installation

```bash
cd projects/02-github-activity
npm install
```

## Usage

```bash
node index.js <github-username>
```

Example:

```bash
node index.js kamranahmedse
# Output:
# - Pushed 3 commits to kamranahmedse/developer-roadmap
# - Opened a new issue in kamranahmedse/developer-roadmap
# - Starred kamranahmedse/developer-roadmap
```

## Contribution

Feel free to open issues or pull requests. Add tests and update the README when adding features.

## License

No license specified. Add one if you plan to publish or share widely.
