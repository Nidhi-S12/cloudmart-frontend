# CloudMart Frontend

![frontend CI](https://github.com/Nidhi-S12/cloudmart-frontend/actions/workflows/frontend.yml/badge.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white)
![NextAuth](https://img.shields.io/badge/NextAuth.js-v5-purple?logo=auth0&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-multi--stage-2496ED?logo=docker&logoColor=white)
![Deployed on EKS](https://img.shields.io/badge/Deployed%20on-EKS-FF9900?logo=amazon-aws&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

Next.js 14 frontend for the CloudMart e-commerce platform. Handles product browsing, cart management, order placement, and Google OAuth authentication.

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
    classDef user fill:#F59E0B,stroke:#92400e,color:#fff
    classDef page fill:#059669,stroke:#065f46,color:#fff
    classDef api fill:#0EA5E9,stroke:#0369a1,color:#fff
    classDef auth fill:#7C3AED,stroke:#4c1d95,color:#fff

    User(["User"]):::user
    Home["Home\nProduct grid + sidebar"]:::page
    Cart["Cart\nItems + checkout"]:::page
    Orders["Orders\nOrder history"]:::page
    Auth["Google OAuth\nNextAuth.js"]:::auth
    API["API Gateway"]:::api

    User -->|visit site| Home
    Home -->|server-side fetch at render| API
    User -->|add items| Cart
    Cart -->|in-memory state\nReact Context| Cart
    User -->|sign in| Auth
    Auth -->|JWT session cookie| User
    Cart -->|checkout\ncustomerId = session email| API
    User -->|view history| Orders
    Orders -->|fetch orders| API
```

---

## Data Flows

### Page load — product listing

```mermaid
sequenceDiagram
    participant B as Browser
    participant FE as Next.js Pod
    participant GW as API Gateway
    participant PS as Product Service
    participant DB as PostgreSQL

    B->>FE: GET /
    Note over FE: Server Component — runs on pod, not browser
    par fetch products
        FE->>GW: GET /api/products
        GW->>PS: GET /products
        PS->>DB: SELECT products
        DB-->>FE: product rows
    and fetch categories
        FE->>GW: GET /api/products/categories
        GW->>PS: GET /products/categories
        PS->>DB: SELECT DISTINCT category
        DB-->>FE: categories
    end
    FE-->>B: rendered HTML
```

### Checkout flow

```mermaid
sequenceDiagram
    participant B as Browser
    participant FE as Next.js
    participant GW as API Gateway
    participant OS as Order Service
    participant R as Redis
    participant K as Kafka

    B->>FE: click Checkout
    Note over FE: customerId = session.user.email
    FE->>GW: POST /api/orders
    GW->>OS: POST /orders
    par
        OS->>R: store order with 24h TTL
    and
        OS->>K: publish order.created event
    end
    OS-->>FE: 201 created
    FE-->>B: confirmation modal
```

### Google OAuth login

```mermaid
sequenceDiagram
    participant B as Browser
    participant T as Traefik
    participant FE as Next.js / NextAuth
    participant G as Google

    B->>T: GET /api/auth/signin/google
    Note over T: priority 20 rule → frontend
    T->>FE: forward
    FE-->>B: redirect to Google
    B->>G: user authenticates
    G-->>B: redirect to /api/auth/callback/google
    B->>T: GET /api/auth/callback/google
    T->>FE: forward (priority 20 rule)
    FE->>G: exchange code for tokens
    G-->>FE: access token
    FE-->>B: Set session cookie (signed JWT)
    Note over B: useSession() returns user info
```

> **Why priority 20?** Without this Traefik rule, `/api/auth/*` would route to the api-gateway (priority 10), which returns 404. The higher-priority rule ensures NextAuth callbacks always reach the frontend.

---

## Authentication

Google OAuth via NextAuth.js v5 with App Router. Handles the full OAuth flow — redirects, token exchange, session management — without writing auth logic from scratch.

| Variable | Source | Description |
|----------|--------|-------------|
| `GOOGLE_CLIENT_ID` | AWS Secrets Manager | Google Cloud Console OAuth 2.0 |
| `GOOGLE_CLIENT_SECRET` | AWS Secrets Manager | Google Cloud Console OAuth 2.0 |
| `NEXTAUTH_SECRET` | AWS Secrets Manager | Signs JWT session cookies |
| `NEXTAUTH_URL` | Kustomize patch | Full public URL of the app |

---

## CI Pipeline

```mermaid
flowchart TD
    classDef git fill:#24292e,stroke:#000,color:#fff
    classDef sec fill:#EF4444,stroke:#991b1b,color:#fff
    classDef build fill:#0EA5E9,stroke:#0369a1,color:#fff
    classDef cd fill:#EF7B4D,stroke:#9a3412,color:#fff

    Push["git push"]:::git

    subgraph Security["Security Scans"]
        GL["Gitleaks"]:::sec
        SG["Semgrep"]:::sec
        TV1["Trivy\ndependency scan"]:::sec
    end

    subgraph Build["Docker Build — 3 stages"]
        D1["deps\nnpm ci"]:::build
        D2["builder\nnext build — standalone"]:::build
        D3["runtime\ncopy standalone only\nnon-root user"]:::build
        GHCR["push to registry\ntagged with git SHA"]:::build
        TV2["Trivy image scan"]:::sec
    end

    subgraph GitOps["Update GitOps"]
        KZ["kustomize edit set image"]:::cd
        GC["git commit + rebase + push"]:::cd
        ACD["ArgoCD\nrolling update — zero downtime"]:::cd
    end

    Push --> Security
    Security -->|all pass| D1 --> D2 --> D3 --> GHCR --> TV2 --> KZ --> GC --> ACD
```

---

## Pages & Components

```
src/
├── app/
│   ├── page.js                          # Home — product grid + sidebar (SSR)
│   ├── cart/page.js                     # Cart — items, quantities, checkout
│   ├── orders/page.js                   # Order history
│   ├── layout.js                        # Root layout — wraps with Providers
│   └── api/
│       ├── auth/[...nextauth]/route.js  # NextAuth handler (Google OAuth)
│       └── health/route.js             # Health check for K8s probes
├── components/
│   ├── Header.jsx           # Nav — sign in/out, cart link
│   ├── ProductCard.jsx      # Product tile
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
| `NEXTAUTH_URL` | Kustomize patch | Full public URL — required by NextAuth |
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
