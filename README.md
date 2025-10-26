# Sentinel 2.0 – Intelligent Password Security Manager

Sentinel is a modular Electron + React desktop application that combines secure credential storage, automated password hygiene, and an AI assistant. This refactor introduces a modern architecture with encryption, breach monitoring, reset automation, and a smart dashboard UI.

## Features

- **Modular Electron Architecture** – Separate `src/main`, `src/preload`, `src/renderer`, `src/utils`, `src/automation`, and `src/services` modules with strict TypeScript typings.
- **Encrypted Vault** – AES-256-GCM encryption using a key stored securely via Keytar. Data persists locally in a `better-sqlite3` database.
- **Automation Engine** – Scheduled breach checks with HaveIBeenPwned integration, simulated password reset flows, and IMAP 2FA retrieval.
- **AI Assistant** – Embedded ChatGPT-style panel powered by the OpenAI API to analyse password strength, explain alerts, and recommend policies.
- **Smart Dashboard** – Tailwind-powered React interface with charts, breach status, strength scores, and per-account automation toggles.
- **Security Hardening** – Idle lock after 5 minutes, biometric unlock hooks (Windows Hello / Touch ID), and encrypted import/export flows.
- **Dev Experience** – Jest unit tests, ESLint + Prettier, dotenv config, winston logging, and electron-updater integration.

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- (Optional) [node-windows-hello](https://www.npmjs.com/package/node-windows-hello) for Windows Hello and [node-mac-touchid](https://www.npmjs.com/package/node-mac-touchid) for Touch ID support. These are listed as optional dependencies.

### Environment Variables

Create a `.env` file in the project root to configure secrets:

```
SENTINEL_ENCRYPTION_KEY= # optional override for vault encryption key
HIBP_API_KEY=           # optional HaveIBeenPwned API key
IMAP_HOST=              # optional IMAP automation host
IMAP_PORT=993
IMAP_SECURE=true
IMAP_USER=
IMAP_PASS=
VITE_OPENAI_API_KEY=    # required for AI assistant (OpenAI API key)
```

### Installation

```bash
npm install
```

### Development

Run all watchers, Vite dev server, and Electron simultaneously:

```bash
npm run dev
```

The renderer UI lives at `http://localhost:5174` during development.

### Testing

```bash
npm test
```

### Production Build

```bash
npm run build
```

### Running the Packaged App

After `npm run build`, start Electron from the compiled output:

```bash
npm start
```

## Directory Structure

```
src/
  automation/          Password automation engine and schedulers
  main/                Electron main-process code (window creation, IPC, biometrics)
  preload/             Secure context bridge exposing Sentinel API
  renderer/            React + Tailwind dashboard UI
  services/            External integrations (breach monitoring, IMAP)
  utils/               Encryption, database, logging, configuration helpers
  types/               Shared ambient type definitions
```

## Automation & AI Workflows

1. **Breach Monitoring** – `PasswordResetEngine` polls HaveIBeenPwned every 15 minutes. Compromised accounts trigger notifications and optional automatic resets.
2. **Password Reset Simulation** – Integrates with IMAP to fetch verification codes and logs each step, surfaced in the Automation Log panel.
3. **AI Assistant** – Provides conversational guidance, summarises security posture, and suggests password strategies using OpenAI responses.

## Import/Export

Use the dashboard buttons to export an encrypted JSON snapshot or import an existing vault. Files are encrypted payloads that can be backed up securely.

## Logging

Structured logs are written to the `logs/` directory and include automation events, errors, and updater status.

## Disclaimer

External integrations such as IMAP, OpenAI, HaveIBeenPwned, and biometrics may require additional configuration, platform-specific dependencies, or billing. The automation flows are simulated; extend them with real browser automation tooling for production use.
