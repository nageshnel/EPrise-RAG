# EPrise API Gateway (`eprise-api-gateway`)

The `eprise-api-gateway` acts as the edge entry point of the **EPrise AI-RAG** platform. It handles client routing, user authentication, and safety rate-limiting before propagating requests downstream.

---

## 1. Features
* **Reverse Proxy:** Dynamic routing of client traffic to internal microservices via Spring Cloud Gateway.
* **Edge Authentication:** Verifies JWT access tokens and rejects unauthorized traffic before it reaches backend services.
* **Identity Propagation:** Extracts user claims (user ID, username, and role) from the validated JWT and appends them to downstream requests as HTTP headers (`X-User-Id`, `X-User-Username`, `X-User-Role`).

---

## 2. Ports
* **HTTP Port:** `8080` (Exposed to the public internet/load balancer)

---

## 3. Environment Variables & Configurations

| Variable Name | Default Value | Description |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | `dev` | Active Spring profile (`dev` or `prod`). |
| `SERVER_PORT` | `8080` | Network port for incoming client connections. |
| `SPRING_R2DBC_URL` | `r2dbc:postgresql://localhost:5432/eprise_ai` | Reactive database URL for user authentication storage. |
| `SPRING_R2DBC_USERNAME` | `eprise` | Database login username. |
| `SPRING_R2DBC_PASSWORD` | `eprise` | Database login password. |
| `JWT_SECRET` | `replace-me-with-a-secure-256-bit-key` | HMAC SHA signing key used to validate client JWTs. |
| `GATEWAY_API_KEY` | `replace-me` | Internal API Key for service-to-service validation. |

---

## 4. Downstream Routes

| Source Route Prefix | Downstream Destination Service | Default Target URL |
| :--- | :--- | :--- |
| `/chat/**` | `eprise-rag-orchestrator-service` | `http://localhost:8084` |
| `/documents/**` | `eprise-ai-etl-service` | `http://localhost:8081` |
| `/media/**` | `eprise-media-service` | `http://localhost:8085` |
