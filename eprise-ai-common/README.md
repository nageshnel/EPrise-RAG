# EPrise AI Common Library (`eprise-ai-common`)

The `eprise-ai-common` module is a shared Maven library that compiles common configurations, utility classes, security models, and custom tracing logic shared across all internal microservices in the **EPrise AI-RAG** platform.

---

## 1. Features
* **Shared DTOs & Models:** Defines standard entities like `AppUser`, `AppRole`, and session payloads to keep database schemas and event payloads identical.
* **Security Util Utilities:** Houses common password encoders, security filters, and JWT claims extractors.
* **OpenTelemetry & APM Telemetry Annotations:** Configures JVM-wide OpenTelemetry tracers and Apache SkyWalking logging interceptors.
* **Exception Handlers:** Provides global rest exception classes and handlers (like `ResourceNotFoundException`, `UnauthorizedException`) to standardize API error outputs across all REST endpoints.

---

## 2. Dependency Usage
This library is not a standalone executable Spring Boot app; it is built as a standard `.jar` package.

To include these common utilities inside a new microservice module, add this dependency in your module's `pom.xml`:

```xml
<dependency>
    <groupId>com.v76.eprise</groupId>
    <artifactId>eprise-ai-common</artifactId>
    <version>${project.version}</version>
</dependency>
```

---

## 3. Directory Layout

* `src/main/java/com/v76/eprise/common/config/`: Valkey/Redis cache configurations and common properties.
* `src/main/java/com/v76/eprise/common/security/`: Security filters, password matching, and JWT properties.
* `src/main/java/com/v76/eprise/common/exceptions/`: Custom checked and unchecked exception handlers.
* `src/main/java/com/v76/eprise/common/tracing/`: SkyWalking APM tracing configurations and spans helper classes.
