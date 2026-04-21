@echo off
cd /d "%~dp0"

echo ==========================================
echo   Starting AI Roadmap Application
echo ==========================================

echo [1/2] Starting Python Backend (Recommendation Service)...
cd recommendation_service
if exist "..\.venv311\Scripts\python.exe" (
	start "Python Backend" "..\.venv311\Scripts\python.exe" app.py
) else (
	start "Python Backend" python app.py
)
cd ..

echo [2/2] Starting Frontend (Vite)...
echo Close this window to stop the frontend.
cmd /k "npm run dev"
