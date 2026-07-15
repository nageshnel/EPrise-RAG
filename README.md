# AIRAG Architecture EPrise POC

Java-only multi-service RAG POC based on `AIRAG-Architecture-POC.pdf`.

## Confirmed architecture

- Spring Boot 3.5 multi-module Java 21 project.
- Spring Security is enabled at the API Gateway and internal services.
- Spring Cloud Gateway is the public edge service.
- Kubernetes `LoadBalancer` exposes only the gateway.
- Spring Cloud Kubernetes Discovery + Spring Cloud LoadBalancer support resource discovery.
- LangChain4j is used only for chunking.
- Spring AI is used for embedding and chat model integration.
- Whisper is deployed separately as a microservice and called by the media service.
- PostgreSQL + pgvector stores chunk embeddings.
- Kafka carries chunk events between ingestion/media and embedding.

## Modules

```text
airag-poc
├── eprise-api-gateway
├── eprise-ai-common
├── eprise-shared-events
├── eprise-ai-etl-service
├── eprise-media-service
├── eprise-embedding-service
├── eprise-retrieval-service
├── eprise-rag-orchestrator-service
├── infrastructure
└── docs
```

## Development & Planning Workflow

To maintain a structured and traceable record of changes:
1. **Implementation Plan**: Whenever an implementation plan is generated, save and download a copy of it to the `docs/` folder using a descriptive context-based name (e.g., `docs/<feature_context>_implementation_plan.md`).
2. **Task Checklist**: Along with the plan, save and download the corresponding task details checklist file to the `docs/` folder (e.g., `docs/<feature_context>_task.md`) to document the progress of each step.

## Build

### Compiling local code
```powershell
cd "D:\AI info\v76-eprise\airag-poc"
mvn clean verify
```

### Creating Container Images
Build OCI-compliant docker container images for all 7 microservices using buildpacks:
```powershell
# Default build: compiles modules and tags as airag/<service-name>:0.1.0
.\build-images.bat

# Custom prefix and tag:
.\build-images.bat "my-private-registry.io/airag/" "v1.0.0"
```


## Run local infrastructure

```powershell
docker compose -f infrastructure\docker-compose.yml up -d
```

## Deploy to Kubernetes

```powershell
cd "D:\AI info\v76-eprise\airag-poc\infrastructure\kubernetes"
kubectl apply -f namespace.yaml
kubectl apply -f rbac-discovery.yaml
kubectl apply -f config.yaml
kubectl apply -f postgres.yaml
kubectl apply -f kafka.yaml
kubectl apply -f whisper.yaml
kubectl apply -f apps.yaml
```

## Gateway access

Send all client traffic through the gateway with an API key:

```powershell
curl.exe -H "X-API-Key: change-me" http://localhost:8080/chat
```
