# EPrise Embedding Generation Service (`eprise-embedding-service`)

The `eprise-embedding-service` is an event consumer that listens to Kafka topics, processes chunk creation events, requests high-dimensional vector embeddings from Spring AI (OpenRouter/OpenAI), and persists them into PostgreSQL.

---

## 1. Features
* **Kafka Listener:** Consumes `ChunkCreatedEvent` messages asynchronously.
* **Vector Embeddings generation:** Requests 1536-dimensional vector representations from OpenRouter/OpenAI (`text-embedding-3-small` or similar models).
* **Database Persistence:** Inserts document chunk text and vector embedding dimensions into PostgreSQL tables using JDBC transactions.

---

## 2. Ports
* **HTTP Port:** `8082` (Utilized for Spring Boot Actuator and health metrics)

---

## 3. Environment Variables & Configurations

| Variable Name | Default Value | Description |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | `dev` | Active Spring profile (`dev` or `prod`). |
| `SERVER_PORT` | `8082` | Network port for metrics collection. |
| `SPRING_KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Kafka broker endpoints. |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/eprise_ai` | Database connection string for storing chunk data. |
| `SPRING_DATASOURCE_USERNAME` | `eprise` | Database login username. |
| `SPRING_DATASOURCE_PASSWORD` | `eprise` | Database login password. |
| `OPENAI_API_KEY` | *(Required)* | OpenRouter API Key. |
| `OPENAI_BASE_URL` | `https://openrouter.ai/api` | API Base URL for embedding models. |
| `SPRING_AI_EMBEDDING_MODEL` | `openai/text-embedding-3-small` | Spring AI target embedding model identifier. |

---

## 4. API Endpoints
* **`GET /actuator/health`**: Service health and connection diagnostics.
