# CloudMart Frontend

Next.js 14 frontend for the CloudMart e-commerce platform. Handles product browsing, cart management, order placement, and Google OAuth authentication.

**Live at:** `https://tulunad.click`

---

## Repositories

| Repo | Purpose |
|------|---------|
| [cloudmart-gitops](https://github.com/Nidhi-S12/cloudmart-gitops) | Terraform, Helm values, K8s manifests, ArgoCD config |
| [cloudmart-services](https://github.com/Nidhi-S12/cloudmart-services) | Backend microservices |
| [cloudmart-frontend](https://github.com/Nidhi-S12/cloudmart-frontend) | This repo — Next.js frontend |

---

## Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js 14** (App Router) | React framework — server components, file-based routing |
| **NextAuth.js v5** | Google OAuth authentication |
| **Docker** | Multi-stage container build |
| **GitHub Actions** | CI — security scans, build, push to GHCR |
| **ArgoCD** | CD — GitOps deployment to EKS (manifests in cloudmart-gitops) |

---

## Application Flow

```
User visits tulunad.click
        │
        ▼
Next.js Server Component (page.js)
        │  fetch /api/products  (server-side at render time)
        ▼
API Gateway  →  Product Service  →  RDS PostgreSQL
        │
        │  returns product list
        ▼
Page renders with products + category sidebar
        │
User adds to cart (client-side state — React Context)
        │
User signs in with Google
        │
        ▼
NextAuth.js  (/api/auth/*)
        │  OAuth 2.0 flow via Google
        │  session stored in signed JWT cookie
        ▼
User is authenticated — session.user.email available
        │
User proceeds to checkout
        │
        ▼
POST /api/orders  →  API Gateway  →  Order Service
        │  customerId = session.user.email
        ▼
Order created → stored in Redis → Kafka event published
```

---

## Authentication

Google OAuth is implemented with NextAuth.js v5 using the App Router.

**Why NextAuth?** It handles the entire OAuth flow — redirects, token exchange, session management — without needing to store credentials or build auth logic from scratch.

**How it works:**

```
1. User clicks "Sign in with Google"
2. NextAuth redirects to accounts.google.com
3. User approves → Google redirects back to /api/auth/callback/google
4. NextAuth exchanges the code for tokens, creates a session (signed JWT cookie)
5. useSession() hook gives any client component access to session.user
```

**Traefik routing note:** The `/api/auth/*` path must be routed to the frontend (NextAuth handler), not the api-gateway. This is handled in cloudmart-gitops with a higher-priority IngressRoute rule (priority 20 vs 10).

### Required Secrets

Stored in AWS Secrets Manager (`cloudmart/google-oauth`) and injected as environment variables via External Secrets Operator:

| Variable | Description |
|----------|------------|
| `GOOGLE_CLIENT_ID` | From Google Cloud Console OAuth 2.0 credentials |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console OAuth 2.0 credentials |
| `NEXTAUTH_SECRET` | Random 32-character string — used to sign JWT session cookies |
| `NEXTAUTH_URL` | Set to `https://tulunad.click` via Kustomize patch |

---

## Pages & Components

```
src/
├── app/
│   ├── page.js              # Home — product grid with category sidebar
│   ├── cart/page.js         # Cart — items, quantities, checkout
│   ├── orders/page.js       # Order history
│   ├── layout.js            # Root layout — wraps all pages with Providers
│   └── api/
│       ├── auth/[...nextauth]/route.js   # NextAuth handler (Google OAuth)
│       └── health/route.js              # Health check endpoint
│
├── components/
│   ├── Header.jsx            # Navigation — sign in/out, cart link
│   ├── ProductCard.jsx       # Individual product tile
│   ├── CategorySidebar.jsx   # Category filter sidebar
│   ├── OrderModal.jsx        # Order confirmation modal
│   └── Providers.jsx         # SessionProvider + CartProvider wrapper
│
├── context/
│   └── CartContext.jsx       # Client-side cart state (React Context)
│
└── lib/
    └── api.js                # fetch wrappers for all API calls
```

---

## CI Pipeline

```
Push to main
    │
    ▼
1. Security Scans
   ├── Gitleaks   — scans for accidentally committed secrets
   ├── Semgrep    — SAST (JavaScript/React rules, OWASP Top 10)
   └── Trivy      — dependency CVE scan
    │
    ▼
2. Build & Push
   ├── docker build  (multi-stage — deps → Next.js build → minimal runtime)
   ├── docker push   → ghcr.io/nidhi-s12/cloudmart/frontend:sha-<7-char-sha>
   └── Trivy image scan
    │
    ▼
3. Update GitOps
   ├── Clone cloudmart-gitops
   ├── kustomize edit set image  (updates frontend image tag)
   └── git commit + pull --rebase + push
        │
        ▼
   ArgoCD deploys new image to EKS (zero-downtime rolling update)
```

---

## Docker Build

The Dockerfile uses a 3-stage build to keep the final image small:

```
Stage 1 — deps
  node:20-alpine
  npm ci  (installs exact versions from package-lock.json)

Stage 2 — builder
  node:20-alpine
  copies node_modules from stage 1
  runs next build  (output: standalone)

Stage 3 — runtime
  node:20-alpine
  copies only .next/standalone and .next/static
  runs as non-root user (appuser)
  final image is ~150MB vs ~1GB with full node_modules
```

`output: 'standalone'` in `next.config.js` tells Next.js to produce a self-contained server bundle — no need to copy `node_modules` into the final image.

---

## Environment Variables

| Variable | Set by | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_API_URL` | Kustomize patch | API base URL — baked into JS bundle at build time |
| `NEXTAUTH_URL` | Kustomize patch | Full URL of the app — required by NextAuth |
| `GOOGLE_CLIENT_ID` | External Secrets (AWS SM) | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | External Secrets (AWS SM) | Google OAuth client secret |
| `NEXTAUTH_SECRET` | External Secrets (AWS SM) | JWT signing secret |

`NEXT_PUBLIC_*` variables are baked into the JavaScript bundle at build time by Next.js. All others are injected at runtime via Kubernetes Secrets.

---

## Local Development

```bash
npm install

# Create .env.local with your own values
cp .env.example .env.local  # or create manually:
cat > .env.local <<EOF
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=any-random-string-for-local-dev
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
EOF

npm run dev
# → http://localhost:3000
```

> The backend services must be running (or use the Docker Compose setup in cloudmart-services) for API calls to work.
