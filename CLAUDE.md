# BrowserInfoCards

A web app that displays browser information in a card-based UI.

## Quick Reference

| Setting | Value |
|---------|-------|
| URL | https://www.browserinfocards.com |
| Server | Server1 (46.62.171.191) |
| Deploy | `./§deploy` |
| Package Manager | `bun` |

## Deployment

Static site deployed to Server1 nginx:

```bash
./§deploy  # Increments build, builds, deploys
```

**Location on server**: `/var/www/browserinfocards.com`

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Wouter (routing)
- TanStack Query

## Build Version

- Stored in `version.json`
- Auto-incremented by `§deploy`
- Displayed bottom-right of page
