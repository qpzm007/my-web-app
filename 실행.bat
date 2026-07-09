@echo off
chcp 65001 >nul
title Smart Factory - 로컬 실행

echo =============================================
echo   Smart Factory 로컬 서버 시작
echo =============================================
echo.

:: Node.js 설치 확인
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [오류] Node.js가 설치되어 있지 않습니다.
    echo https://nodejs.org 에서 Node.js를 설치한 후 다시 실행하세요.
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js 버전: 
node -v

:: node_modules 없으면 자동 설치
if not exist "node_modules\" (
    echo.
    echo [설치] 패키지를 설치합니다. 잠시 기다려주세요...
    npm install
    if %errorlevel% neq 0 (
        echo [오류] 패키지 설치에 실패했습니다.
        pause
        exit /b 1
    )
    echo [OK] 패키지 설치 완료
)

:: 브라우저 자동 열기 (3초 후)
echo.
echo [시작] 개발 서버를 시작합니다...
echo       브라우저가 자동으로 열립니다.
echo       종료하려면 이 창을 닫으세요.
echo.

start /b cmd /c "timeout /t 3 >nul && start http://localhost:3000"

:: 서버 실행
npm run dev

pause
