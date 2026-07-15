# EPrise Media Transcription Service (`eprise-media-service`)

The `eprise-media-service` handles audio and video media ingestion, converting speech to text via OpenRouter Whisper ASR APIs and publishing the resulting transcription segments as chunks.

---

## 1. Features
* **Speech-to-Text Transcription:** Integrates with OpenAI Whisper models via the OpenRouter API.
* **Large File Support:** Configured to accept up to 10MB audio and video files.
* **Kafka Pipeline Integration:** Publishes transcription chunk events asynchronously to Kafka topics for vector processing.

---

## 2. Ports
* **HTTP Port:** `8085`

---

## 3. Environment Variables & Configurations

| Variable Name | Default Value | Description |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | `dev` | Active Spring profile (`dev` or `prod`). |
| `SERVER_PORT` | `8085` | Network port for media ingestion endpoint. |
| `SPRING_KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Kafka broker endpoints. |
| `SERVICES_WHISPER_URL` | `https://openrouter.ai/api/v1` | Whisper ASR WebService base url. |
| `OPENAI_API_KEY` | *(Required)* | OpenRouter API authorization token. |

---

## 4. API Endpoints

* **`POST /media/transcribe`**: Uploads media file and triggers Whisper transcription.
* **`GET /actuator/health`**: Readiness/Liveness health status.
