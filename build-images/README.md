# Container Image Build & Execution Instructions

This directory contains standard Dockerfiles and stack files for containerizing and deploying the 7 microservices in the **AIRAG POC** system.

---

## 1. Prerequisites
Before building the container images, compile and package the Java microservices into executable fat JARs. 

Run the following command from the **project root directory**:
```bash
# Clean, compile, and package the entire multi-module Maven project
mvn clean package -Dmaven.test.skip=true
```

---

## 2. Building Docker Images
All `docker build` commands must be run from the **project root directory** (so that the build context includes the target JAR files inside each module).

Run the following commands to build the images:

```bash
# 1. Edge Gateway
docker build -t airag/gems-api-gateway:0.1.0 -f build-images/Dockerfile.gems-api-gateway .

# 2. ETL Ingestion Service
docker build -t airag/gems-ai-etl-service:0.1.0 -f build-images/Dockerfile.gems-ai-etl-service .

# 3. Media Transcription Service
docker build -t airag/gems-media-service:0.1.0 -f build-images/Dockerfile.gems-media-service .

# 4. Embedding Generation Service
docker build -t airag/gems-embedding-service:0.1.0 -f build-images/Dockerfile.gems-embedding-service .

# 5. gRPC Retrieval Service
docker build -t airag/gems-retrieval-service:0.1.0 -f build-images/Dockerfile.gems-retrieval-service .

# 6. RAG Orchestrator Service
docker build -t airag/gems-rag-orchestrator-service:0.1.0 -f build-images/Dockerfile.gems-rag-orchestrator-service .

# 7. gRPC OCR Service
docker build -t airag/gems-ocr-service:0.1.0 -f build-images/Dockerfile.gems-ocr-service .
```

---

## 3. Running Containers Locally (Single Node)

To run the containers individually, map the host ports to the exposed container ports:

```bash
# 1. Edge Gateway
docker run -d -p 8080:8080 --name gems-api-gateway airag/gems-api-gateway:0.1.0

# 2. ETL Ingestion Service
docker run -d -p 8081:8081 --name gems-ai-etl-service airag/gems-ai-etl-service:0.1.0

# 3. Media Service
docker run -d -p 8085:8085 --name gems-media-service airag/gems-media-service:0.1.0

# 4. Embedding Service
docker run -d -p 8082:8082 --name gems-embedding-service airag/gems-embedding-service:0.1.0

# 5. Retrieval Service
docker run -d -p 8083:8083 --name gems-retrieval-service airag/gems-retrieval-service:0.1.0

# 6. RAG Orchestrator
docker run -d -p 8084:8084 --name gems-rag-orchestrator-service airag/gems-rag-orchestrator-service:0.1.0

# 7. OCR Service
docker run -d -p 8086:8086 -p 9086:9086 --name gems-ocr-service airag/gems-ocr-service:0.1.0
```

---

## 4. Docker Swarm Orchestration Setup

Docker Swarm allows you to run these microservices in a highly available, multi-replica clustered state. Follow these instructions to initialize a Swarm cluster and deploy the stack.

### Step 4.1: Initialize Swarm Mode
If you haven't already, enable Swarm mode on your manager node:
```bash
docker swarm init
```
*(Optional)* Add worker nodes by running the join command outputted above on your other servers.

### Step 4.2: Start a Local Container Registry
Because Swarm nodes distribute containers dynamically across multiple servers, they must be able to pull the custom images from a registry.

Start a local secure registry service on Swarm:
```bash
docker service create --name registry --publish published=5000,target=5000 registry:2
```

### Step 4.3: Tag and Push Images to the Local Registry
Re-tag your built images and push them to the local registry so they are reachable by all Swarm nodes:

```bash
# Tag images
docker tag airag/gems-api-gateway:0.1.0 localhost:5000/airag/gems-api-gateway:0.1.0
docker tag airag/gems-ai-etl-service:0.1.0 localhost:5000/airag/gems-ai-etl-service:0.1.0
docker tag airag/gems-media-service:0.1.0 localhost:5000/airag/gems-media-service:0.1.0
docker tag airag/gems-embedding-service:0.1.0 localhost:5000/airag/gems-embedding-service:0.1.0
docker tag airag/gems-retrieval-service:0.1.0 localhost:5000/airag/gems-retrieval-service:0.1.0
docker tag airag/gems-rag-orchestrator-service:0.1.0 localhost:5000/airag/gems-rag-orchestrator-service:0.1.0
docker tag airag/gems-ocr-service:0.1.0 localhost:5000/airag/gems-ocr-service:0.1.0

# Push images
docker push localhost:5000/airag/gems-api-gateway:0.1.0
docker push localhost:5000/airag/gems-ai-etl-service:0.1.0
docker push localhost:5000/airag/gems-media-service:0.1.0
docker push localhost:5000/airag/gems-embedding-service:0.1.0
docker push localhost:5000/airag/gems-retrieval-service:0.1.0
docker push localhost:5000/airag/gems-rag-orchestrator-service:0.1.0
docker push localhost:5000/airag/gems-ocr-service:0.1.0
```

### Step 4.4: Deploy the Stack
Specify the environment variable for the local registry prefix and deploy the stack configuration (`build-images/docker-stack.yml`):

**On Linux/macOS:**
```bash
export REGISTRY_PREFIX=localhost:5000/airag
docker stack deploy -c build-images/docker-stack.yml airag-stack
```

**On Windows PowerShell:**
```powershell
$env:REGISTRY_PREFIX="localhost:5000/airag"
docker stack deploy -c build-images/docker-stack.yml airag-stack
```

---

## 5. Managing the Swarm Stack

### Check Deploy Status
List active services and check task statuses (replicas running):
```bash
# View list of stack services
docker stack services airag-stack

# View status of individual container tasks
docker stack ps airag-stack
```

### Scale a Service Dynamically
You can scale individual services on the fly without stopping the stack:
```bash
# Scale the API Gateway service to 4 replicas
docker service scale airag-stack_gems-api-gateway=4
```

### Teardown Stack
To remove the stack and delete the running containers and network definitions:
```bash
docker stack rm airag-stack
```
