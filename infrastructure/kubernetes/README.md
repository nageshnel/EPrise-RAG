# Kubernetes Deployment

Apply in order:

```powershell
kubectl apply -f namespace.yaml
kubectl apply -f rbac-discovery.yaml
kubectl apply -f config.yaml
kubectl apply -f postgres.yaml
kubectl apply -f kafka.yaml
kubectl apply -f whisper.yaml
kubectl apply -f apps.yaml
```

The public entrypoint is `gems-api-gateway`, exposed as a Kubernetes `LoadBalancer` service.

Internal services use Spring Cloud Kubernetes Discovery and stable service names:

- `gems-ai-etl-service`
- `gems-media-service`
- `gems-embedding-service`
- `gems-retrieval-service`
- `gems-rag-orchestrator-service`

The gateway routes use `lb://service-name` so the Kubernetes discovery client and Spring Cloud LoadBalancer handle resource discovery and balancing.
