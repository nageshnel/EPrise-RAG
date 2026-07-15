# EPrise gRPC Retrieval Service (`eprise-retrieval-service`)

The `eprise-retrieval-service` is a low-latency gRPC microservice that queries the vector database (`pgvector`) for similar document chunks using cosine similarity. It stores frequently requested vector searches inside a Valkey cache.

---

## 1. Features
* **gRPC Server Interface:** Exposes the retrieval interfaces using high-performance protocol buffers.
* **Vector Similarity Search:** Queries the database using `hnsw` index searches for fast similarity matching.
* **Valkey Caching Layer:** Caches retrieval lists to avoid hitting the database for redundant prompt queries.

---

## 2. Ports
* **gRPC Port:** `9083` (Default internal gRPC listener port)
* **HTTP Port:** `8083` (Spring Boot Actuator health endpoint port)

---

## 3. Environment Variables & Configurations

| Variable Name | Default Value | Description |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | `dev` | Active Spring profile (`dev` or `prod`). |
| `SERVER_PORT` | `8083` | HTTP port for actuator metrics. |
| `GRPC_SERVER_PORT` | `9083` | Low-latency gRPC service port. |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/eprise_ai` | PostgreSQL connection string. |
| `SPRING_DATASOURCE_USERNAME` | `eprise` | Database login username. |
| `SPRING_DATASOURCE_PASSWORD` | `eprise` | Database login password. |
| `SPRING_DATA_REDIS_HOST` | `localhost` | Valkey (Redis-compatible) cache server host. |
| `SPRING_DATA_REDIS_PORT` | `6379` | Valkey cache server port. |

---

## 4. API & gRPC Interfaces

* **gRPC Service Method:** `RetrievalService/retrieve` (Returns matching text chunks and cosine similarity percentages based on query embeddings).
* **`GET /actuator/health`**: HTTP health metrics.
