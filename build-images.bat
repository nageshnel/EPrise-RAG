@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   AIRAG POC - OCI Container Image Builder
echo ===================================================

:: Configuration parameters
set "DEFAULT_PREFIX=airag/"
set "DEFAULT_TAG=0.1.0"

:: Read input variables
set "REGISTRY_PREFIX=%~1"
if "%REGISTRY_PREFIX%"=="" (
    set "REGISTRY_PREFIX=%DEFAULT_PREFIX%"
)

set "IMAGE_TAG=%~2"
if "%IMAGE_TAG%"=="" (
    set "IMAGE_TAG=%DEFAULT_TAG%"
)

echo Registry Prefix: %REGISTRY_PREFIX%
echo Container Tag:   %IMAGE_TAG%
echo.
echo Step 1: Compiling dependencies...
call mvnd clean install -DskipTests
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Maven build failed! Aborting image creation.
    exit /b %ERRORLEVEL%
)

:: List of microservices to build
set "SERVICES=gems-api-gateway gems-ai-etl-service gems-media-service gems-embedding-service gems-retrieval-service gems-rag-orchestrator-service gems-ocr-service"

echo.
echo Step 2: Generating OCI Container Images via Buildpacks...
for %%s in (%SERVICES%) do (
    echo.
    echo ---------------------------------------------------
    echo   Building Image: %REGISTRY_PREFIX%%%s:%IMAGE_TAG%
    echo ---------------------------------------------------
    call mvnd spring-boot:build-image -pl %%s -Dspring-boot.build-image.imageName=%REGISTRY_PREFIX%%%s:%IMAGE_TAG% -DskipTests
    if !ERRORLEVEL! neq 0 (
        echo [ERROR] Failed to build image for %%s
        exit /b !ERRORLEVEL%
    )
)

echo.
echo ===================================================
echo   All images successfully generated locally!
echo ===================================================
echo List of generated images:
for %%s in (%SERVICES%) do (
    echo   - %REGISTRY_PREFIX%%%s:%IMAGE_TAG%
)
echo.
echo To push these to a remote container registry, run:
echo   docker login [registry-url]
for %%s in (%SERVICES%) do (
    echo   docker push %REGISTRY_PREFIX%%%s:%IMAGE_TAG%
)
