# Frontend Dashboard (React + Vite + TailwindCSS)

Single-Page Dashboard Application for Flyy AI's Privacy-Preserving Customer Data Platform.

## Features

- **Architecture Boundary Visualizer**: Real-time multi-schema topological boundaries.
- **PII Discovery & Profiling**: Scans database samples and generates live masked previews.
- **Privacy Policy Studio**: Rule builder for `TOKENIZE`, `FPE`, `MASK`, and `PASS_THROUGH`.
- **Batch Ingestion Monitor**: High-throughput chunked ingestion pipeline observer.
- **Protected Customer Directory**: Relational customer table running purely on de-identified tokens.
- **Privacy-Safe Campaign Manager**: Marketing email dispatches simulated via Mailpit without plaintext exposure.
- **Webhook & Bounce Simulator**: Simulates external bounce resolution webhooks.
- **Dual-Custody Audited Reveal**: Justified de-anonymization modal with mandatory reason audit.
- **Immutable Governance Ledger**: Real-time compliance audit logs and analytics.

## Tech Stack

- **React 18**: Dynamic single-page UI.
- **Vite 6**: Fast development server and production bundler.
- **Tailwind CSS 3**: Clean, high-contrast, modern UI system.
- **Lucide React**: Clean enterprise iconography.
- **Axios**: HTTP client configured for reverse proxy `/api` routing.

## Development Commands

From inside `frontend/`:

```powershell
# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build

# Preview production build
npm run preview
```

The Vite dev server runs at **`http://localhost:3000`** (or `http://localhost:5173`) and automatically proxies `/api` requests to the FastAPI backend at `http://localhost:8000`.
