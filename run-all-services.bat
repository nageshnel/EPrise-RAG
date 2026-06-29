@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   AIRAG POC - Starting All Java Microservices
echo ===================================================

:: Check for OPENAI_API_KEY (holding the OpenRouter API Key)
if "%OPENAI_API_KEY%"=="" (
    echo [WARNING] OPENAI_API_KEY environment variable is not set.
    echo Services require your OpenRouter API Key to run LLM, embedding, and Whisper operations.
    set /p "temp_key=Enter your OpenRouter API Key (will be mapped to OPENAI_API_KEY): "
    if not "!temp_key!"=="" (
        set "OPENAI_API_KEY=!temp_key!"
        echo OpenRouter API Key successfully configured as OPENAI_API_KEY for this session.
    )
)

if "%OPENAI_BASE_URL%"=="" (
    set "OPENAI_BASE_URL=https://openrouter.ai/api"
    echo OPENAI_BASE_URL default configured to https://openrouter.ai/api for this session.
)

set "SPRING_AI_EMBEDDING_MODEL=openai/text-embedding-3-small"
set "SPRING_AI_CHAT_MODEL=openrouter/free"
echo SPRING_AI_EMBEDDING_MODEL is set to %SPRING_AI_EMBEDDING_MODEL%
echo SPRING_AI_CHAT_MODEL is set to %SPRING_AI_CHAT_MODEL%

echo.
echo Step 1: Compiling and building all Java modules...
call mvnd clean install -DskipTests
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Maven build failed! Please fix build errors before running.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Step 2: Spawning backend services in the background (same window)...

echo Starting ETL Service (Port 8081)...
start /b cmd /c "cd gems-ai-etl-service && mvnd spring-boot:run"
timeout /t 2 /nobreak >nul

echo Starting Embedding Service (Port 8082)...
start /b cmd /c "cd gems-embedding-service && mvnd spring-boot:run"
timeout /t 2 /nobreak >nul

echo Starting Retrieval Service (Port 8083)...
start /b cmd /c "cd gems-retrieval-service && mvnd spring-boot:run"
timeout /t 2 /nobreak >nul

echo Starting RAG Orchestrator (Port 8084)...
start /b cmd /c "cd gems-rag-orchestrator-service && mvnd spring-boot:run"
timeout /t 2 /nobreak >nul

echo Starting Media Service (Port 8085)...
start /b cmd /c "cd gems-media-service && mvnd spring-boot:run"
timeout /t 2 /nobreak >nul

echo Starting OCR Service (Port 8086 / gRPC Port 9086)...
start /b cmd /c "cd gems-ocr-service && mvnd spring-boot:run"
timeout /t 2 /nobreak >nul

echo.
echo Step 3: Starting API Gateway (Port 8080) in the foreground...
cd gems-api-gateway
call mvnd spring-boot:run

