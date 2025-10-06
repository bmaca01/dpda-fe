# DPDA Simulator Frontend

A SPA frontend for interacting with the DPDA simulator API.

## Tech Stack

- **Framework**: Vue 3.5+ (Composition API)
- **Language**: TypeScript 5.6
- **Build**: Vite 6
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

## Backend API

This frontend communicates with the FastAPI backend located at:
- **Local**: `http://localhost:8000`

## Deployment

### Docker

```bash
docker build -t dpda-fe .
docker run -p 3000:80 dpda-fe
```
## License

See [LICENSE](LICENSE) for details.

## Links

- **Backend API**: 
- **Domain**: 
