# EPrise RAG Orchestration Service (`eprise-rag-orchestrator-service`)

The `eprise-rag-orchestrator-service` manages the end-to-end user query execution loop. It fetches conversation history from PostgreSQL, requests context chunks from the Retrieval service, builds enriched prompts, queries the LLM, and streams Server-Sent Events (SSE) tokens to the React Native client.

---

## 1. Features
* **SSE Token Streaming:** Streams LLM responses token-by-token using Spring WebFlux `ServerSentEvent` streams.
* **Persistent History:** Manages user chat sessions and messages inside PostgreSQL.
* **Prompt Construction:** Compiles context templates merging conversation history, system instructions, and vector search citations.

---

## 2. Ports
* **HTTP Port:** `8084` (Exposed to API Gateway)

---

## 3. Environment Variables & Configurations

| Variable Name | Default Value | Description |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | `dev` | Active Spring profile (`dev` or `prod`). |
| `SERVER_PORT` | `8084` | HTTP service port. |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/eprise_ai` | Database connection URL. |
| `SPRING_DATASOURCE_USERNAME` | `eprise` | Database login username. |
| `SPRING_DATASOURCE_PASSWORD` | `eprise` | Database login password. |
| `OPENAI_API_KEY` | *(Required)* | OpenRouter API Key. |
| `OPENAI_BASE_URL` | `https://openrouter.ai/api` | API Endpoint for chat completions. |
| `SPRING_AI_CHAT_MODEL` | `openrouter/free` | LLM model identifier. |

---

## 4. API Endpoints

* **`POST /chat`**: Standard synchronous chat prompt evaluation.
* **`POST /chat/stream`**: Establishes Server-Sent Events (SSE) channel for real-time streaming chat.
* **`GET /chat/sessions`**: List all user conversation sessions.
* **`GET /chat/sessions/{sessionId}/messages`**: Retrieve historical messages in a session.
* **`GET /actuator/health`**: Health status diagnostic metrics.
