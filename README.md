# DPDA Simulator Frontend

A modern, minimal-dependency Vue 3 + TypeScript single-page application (SPA) for interacting with the DPDA (Deterministic Pushdown Automaton) simulator API.

## Quick Start

### Prerequisites
- Node.js v20+ and npm v10+
- Backend API running

### Setup

```bash
npm create vite@latest dpda-fe -- --template vue-ts
cd dpda-fe
npm install
```

### Development

```bash
npm run dev           # Start dev server
npm run test          # Run tests (watch mode)
npm run lint          # Lint code
npm run build         # Build for production
```

## Tech Stack

- **Framework**: Vue 3.5
- **Language**: TypeScript 5.6
- **Styling**: Tailwind CSS v4.1 + shadcn-vue
- **State**: Pinia + TanStack Query
- **Visualization**: Cytoscape.js
- **Testing**: Vitest + @vue/test-utils + Playwright + MSW
- **API**: Axios

## Project Structure

```
src/
├── api/              # API client and typed endpoints
├── components/       # Vue components (ui/, dpda/, compute/, visualization/)
├── composables/      # Reusable Vue composables
├── stores/           # Pinia stores
├── views/            # Page-level components (routes)
├── schemas/          # Zod validation schemas
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
└── router/           # Vue Router configuration

tests/
├── unit/             # Unit tests
├── components/       # Component tests
└── e2e/              # End-to-end tests (Playwright)
```

## License

See [LICENSE](LICENSE) for details.
