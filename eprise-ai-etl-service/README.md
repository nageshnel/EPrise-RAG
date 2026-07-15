# EPrise ETL Ingestion Service (`eprise-ai-etl-service`)

The `eprise-ai-etl-service` manages document ingestion pipelines. It processes file uploads, extracts native text, requests parallel OCR for images, chunks text segments, and publishes them for embedding generation.

---

## 1. Features
* **Multi-Format Extraction:** Utilizes Apache Tika to parse text contents and metadata from PDF, DOCX, and TXT files.
* **MinIO Storage:** Persists uploaded files into object storage under structured folders.
* **Parallel OCR gRPC Client:** Detects embedded image binaries and invokes the OCR service over gRPC asynchronously using `CompletableFuture`.
* **Kafka Event Publishing:** Chunks text via LangChain4j and publishes `ChunkCreatedEvent` messages to Kafka.

---

## 2. Ports
* **HTTP Port:** `8081` (Exposed downstream)

---

## 3. Environment Variables & Configurations

| Variable Name | Default Value | Description |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | `dev` | Active Spring profile (`dev` or `prod`). |
| `SERVER_PORT` | `8081` | Network port for incoming REST requests. |
| `SPRING_KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Kafka broker endpoints for publishing chunk events. |
| `MINIO_ENDPOINT` | `http://localhost:9000` | Object storage connection URL. |
| `MINIO_ACCESS_KEY` | `eprise` | Access key for MinIO. |
| `MINIO_SECRET_KEY` | `eprise-password` | Secret key for MinIO. |
| `MINIO_BUCKET` | `documents` | MinIO bucket name used for document persistence. |
| `SERVICES_OCR_URL` | `localhost:9086` | gRPC address of the OCR extraction microservice. |

---

## 4. API Endpoints

* **`POST /documents/upload`**: Ingests files (`MultipartFile`) and starts the extraction/chunking pipeline.
* **`GET /actuator/health`**: Readiness/Liveness health probes.
