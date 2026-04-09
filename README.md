# CloudMart Frontend

![frontend CI](https://github.com/Nidhi-S12/cloudmart-frontend/actions/workflows/frontend.yml/badge.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)
![NextAuth](https://img.shields.io/badge/NextAuth.js-v5-purple?logo=auth0&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-multi--stage-2496ED?logo=docker&logoColor=white)
![Deployed on EKS](https://img.shields.io/badge/Deployed%20on-EKS-FF9900?logo=amazon-aws&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

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

```mermaid
flowchart TD
    User(["👤 User"])
    Home["Home Page\nProduct grid + category sidebar"]
    Cart["Cart Page\nItems + checkout"]
    Auth["Google OAuth\nNextAuth.js"]
    Orders["Orders Page\nOrder history"]
    API["api-gateway"]

    User -->|"visit tulunad.click"| Home
    Home -->|"server-side fetch at render"| API
    User -->|"add to cart"| Cart
    Cart -->|"cart state is in-memory\nReact Context — no API call"| Cart
    User -->|"sign in"| Auth
    Auth -->|"OAuth with Google\nJWT session cookie"| User
    Cart -->|"checkout\nPOST /api/orders\ncustomerId = session.user.email"| API
    User -->|"view history"| Orders
    Orders -->|"GET /api/orders/customer/:id"| API
```

---

## Data Flows

### Page load — product listing

```mermaid
sequenceDiagram
    participant B as Browser
    participant FE as Next.js Pod (SSR)
    participant GW as api-gateway
    participant PS as product-service
    participant DB as RDS PostgreSQL

    B->>FE: GET https://tulunad.click/
    Note over FE: Server Component runs on the pod
    par fetch products
        FE->>GW: GET /api/products
        GW->>PS: GET /products
        PS->>DB: SELECT * FROM products
        DB-->>PS: rows
        PS-->>FE: JSON
    and fetch categories
        FE->>GW: GET /api/products/categories
        GW->>PS: GET /products/categories
        PS->>DB: SELECT DISTINCT category
        DB-->>PS: categories
        PS-->>FE: JSON
    end
    FE-->>B: HTML with products + sidebar
```

### Checkout flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant FE as Next.js
    participant GW as api-gateway
    participant OS as order-service
    participant R as Redis
    participant K as Kafka

    B->>FE: click Checkout
    Note over B,FE: customerId = session.user.email (from JWT cookie)
    FE->>GW: POST /api/orders {customerId, items}
    GW->>OS: POST /orders
    par
        OS->>R: SET order:<uuid> EX 86400
    and
        OS->>K: PRODUCE order.created
    end
    OS-->>FE: 201 {id, total, status: pending}
    FE-->>B: order confirmation modal
```

### Google OAuth login

```mermaid
sequenceDiagram
    participant B as Browser
    participant Traefik
    participant FE as Next.js (NextAuth)
    participant G as Google

    B->>Traefik: GET /api/auth/signin/google
    Note over Traefik: priority 20 rule → frontend:3000
    Traefik->>FE: forward request
    FE-->>B: 302 redirect to accounts.google.com
    B->>G: user authenticates + approves
    G-->>B: 302 redirect to /api/auth/callback/google
    B->>Traefik: GET /api/auth/callback/google
    Traefik->>FE: forward (priority 20 rule)
    FE->>G: exchange code for tokens
    G-->>FE: access token + id token
    FE-->>B: Set-Cookie: next-auth.session-token (signed JWT)
    Note over B: useSession() now returns {user: {name, email, image}}
```

> **Why priority 20?** Without this rule, Traefik routes `/api/auth/*` to the api-gateway (priority 10 rule), which returns 404. The higher-priority rule ensures NextAuth callbacks always reach the frontend.

---

## Authentication

Google OAuth via NextAuth.js v5 with App Router.

**Why NextAuth?** Handles the full OAuth flow — redirects, token exchange, session management — without writing auth logic or storing credentials.

| Variable | Source | Description |
|----------|--------|-------------|
| `GOOGLE_CLIENT_ID` | AWS Secrets Manager | Google Cloud Console OAuth 2.0 |
| `GOOGLE_CLIENT_SECRET` | AWS Secrets Manager | Google Cloud Console OAuth 2.0 |
| `NEXTAUTH_SECRET` | AWS Secrets Manager | Signs JWT session cookies (32 random chars) |
| `NEXTAUTH_URL` | Kustomize patch | `https://tulunad.click` |

---

## CI Pipeline

```mermaid
flowchart TD
    Push["git push to main"]

    subgraph Security["Security Scans"]
        GL["Gitleaks\nsecrets scan"]
        SG["Semgrep\nSAST — JS/React, OWASP"]
        TV1["Trivy\ndependency CVEs"]
    end

    subgraph Build["Build & Push"]
        D1["Stage 1: deps\nnpm ci"]
        D2["Stage 2: builder\nnext build — standalone output"]
        D3["Stage 3: runtime\ncopy .next/standalone only\nnon-root user\n~150MB final image"]
        GHCR["push to GHCR\n:sha-abc1234"]
        TV2["Trivy image scan"]
    end

    subgraph GitOps["Update GitOps"]
        KZ["kustomize edit set image"]
        GC["git commit + pull --rebase + push"]
        ACD["ArgoCD rolling update\nzero downtime"]
    end

    Push --> Security
    Security -->|all pass| D1 --> D2 --> D3 --> GHCR --> TV2
    TV2 --> KZ --> GC --> ACD
```

---

## Pages & Components

```
src/
├── app/
│   ├── page.js                          # Home — product grid + category sidebar (SSR)
│   ├── cart/page.js                     # Cart — items, quantities, checkout
│   ├── orders/page.js                   # Order history
│   ├── layout.js                        # Root layout — wraps with Providers
│   └── api/
│       ├── auth/[...nextauth]/route.js  # NextAuth handler (Google OAuth)
│       └── health/route.js             # Health check for K8s probes
├── components/
│   ├── Header.jsx           # Nav — sign in/out button, cart link
│   ├── ProductCard.jsx      # Individual product tile
│   ├── CategorySidebar.jsx  # Category filter
│   ├── OrderModal.jsx       # Order confirmation modal
│   └── Providers.jsx        # SessionProvider + CartProvider wrapper
├── context/
│   └── CartContext.jsx      # Client-side cart state (React Context)
└── lib/
    └── api.js               # fetch wrappers for all API calls
```

---

## Environment Variables

| Variable | Set by | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_API_URL` | Kustomize patch | API base URL — baked into JS bundle at build time |
| `NEXTAUTH_URL` | Kustomize patch | `https://tulunad.click` — required by NextAuth |
| `GOOGLE_CLIENT_ID` | External Secrets (AWS SM) | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | External Secrets (AWS SM) | Google OAuth client secret |
| `NEXTAUTH_SECRET` | External Secrets (AWS SM) | JWT signing secret |

`NEXT_PUBLIC_*` vars are baked into the JS bundle at build time. All others are injected at pod startup via K8s Secrets.

---

## Local Development

```bash
npm install

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

> Backend services must be running. Use the Docker Compose setup in cloudmart-services.
