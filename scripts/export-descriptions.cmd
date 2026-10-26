@echo off
rem Regenerate src/go/internal/descriptions/data.json from the TypeScript dictionary.
rem Kept for traceability of the one-off JS -> Go migration.
setlocal
cd /d "%~dp0.."

if not exist .tmp mkdir .tmp
call src\ts\node_modules\.bin\esbuild.cmd scripts/legacy-descriptions.ts --bundle --format=cjs --platform=node --outfile=.tmp/descriptions.cjs
if errorlevel 1 exit /b 1
node scripts/export-descriptions.mjs
endlocal
