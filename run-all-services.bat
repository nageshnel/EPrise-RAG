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

echo.
echo Step 1: Compiling and building all Java modules...
call mvnd clean install -DskipTests
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Maven build failed! Please fix build errors before running.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Step 2: Spawning backend services silently in the background...

echo Starting ETL Service (Port 8081) in background...
powershell -Command "Start-Process cmd -ArgumentList '/c cd gems-ai-etl-service && mvnd spring-boot:run' -WindowStyle Hidden"
timeout /t 2 /nobreak >nul

echo Starting Embedding Service (Port 8082) in background...
powershell -Command "Start-Process cmd -ArgumentList '/c cd gems-embedding-service && mvnd spring-boot:run' -WindowStyle Hidden"
timeout /t 2 /nobreak >nul

echo Starting Retrieval Service (Port 8083) in background...
powershell -Command "Start-Process cmd -ArgumentList '/c cd gems-retrieval-service && mvnd spring-boot:run' -WindowStyle Hidden"
timeout /t 2 /nobreak >nul

echo Starting RAG Orchestrator (Port 8084) in background...
powershell -Command "Start-Process cmd -ArgumentList '/c cd gems-rag-orchestrator-service && mvnd spring-boot:run' -WindowStyle Hidden"
timeout /t 2 /nobreak >nul

echo Starting Media Service (Port 8085) in background...
powershell -Command "Start-Process cmd -ArgumentList '/c cd gems-media-service && mvnd spring-boot:run' -WindowStyle Hidden"
timeout /t 2 /nobreak >nul

echo.
echo Step 3: Starting API Gateway (Port 8080) in this window (keep open)...
cd gems-api-gateway
call mvnd spring-boot:run

