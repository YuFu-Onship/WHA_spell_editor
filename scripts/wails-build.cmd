@echo off
rem Desktop build for the Go-backend WHA spell editor (Wails runtime).
rem
rem Note: the wails CLI (v2.12) currently fails with Go 1.27 ("package embed
rem without types"), so the production binary is built directly with go build
rem using the same tags the CLI would use. The output is identical.
setlocal
cd /d "%~dp0.."

echo [1/3] Running Go tests...
go test ./...
if errorlevel 1 exit /b 1

echo [2/3] Building frontend...
cd src\ts
call npm run build
if errorlevel 1 exit /b 1
cd ..\..

echo [3/3] Building desktop app...
if not exist build\bin mkdir build\bin
go build -tags desktop,production -ldflags "-w -s" -o build\bin\wha-editor-go.exe .
if errorlevel 1 exit /b 1

echo Done: build\bin\wha-editor-go.exe
endlocal
