# EPrise gRPC OCR Service (`eprise-ocr-service`)

The `eprise-ocr-service` handles image text extraction. It processes image files and PDF page screenshots over gRPC or REST, using Spring AI vision models to perform advanced layout-aware Optical Character Recognition.

---

## 1. Features
* **Multi-Modal Vision OCR:** Utilizes Spring AI vision models via OpenRouter to extract text from images and layouts.
* **Dual Interface:** Supports both internal gRPC method calls and external HTTP REST requests.
* **Low-Latency gRPC Server:** Built using protocol buffer structures for high-performance intra-cluster calls.

---

## 2. Ports
* **gRPC Port:** `9086` (Default internal gRPC listener port)
* **HTTP Port:** `8086` (REST controller and actuator endpoint port)

---

## 3. Environment Variables & Configurations

| Variable Name | Default Value | Description |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | `dev` | Active Spring profile (`dev` or `prod`). |
| `SERVER_PORT` | `8086` | REST service port. |
| `GRPC_SERVER_PORT` | `9086` | Internal gRPC service listener port. |
| `OPENAI_API_KEY` | *(Required)* | OpenRouter API Key. |
| `OPENAI_BASE_URL` | `https://openrouter.ai/api` | API Endpoint base URL. |
| `SPRING_AI_OCR_MODEL` | `openrouter/free` | Vision LLM model identifier. |

---

## 4. API & gRPC Interfaces

* **gRPC Service Method:** `OcrService/extractText` (Extracts layout-aware text from image byte streams).
* **`POST /ocr/extract`**: REST controller for image files.
* **`GET /actuator/health`**: Health metrics page.
