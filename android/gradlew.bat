@echo off
setlocal

set "APP_HOME=%~dp0"
set "WRAPPER_PROPERTIES=%APP_HOME%gradle\wrapper\gradle-wrapper.properties"

if not exist "%WRAPPER_PROPERTIES%" (
  echo ERROR: Missing %WRAPPER_PROPERTIES%
  exit /b 1
)

for /f "tokens=1,* delims==" %%A in (%WRAPPER_PROPERTIES%) do (
  if "%%A"=="distributionUrl" set "DISTRIBUTION_URL=%%B"
)

if not defined DISTRIBUTION_URL (
  echo ERROR: distributionUrl is not set in %WRAPPER_PROPERTIES%
  exit /b 1
)

set "DISTRIBUTION_URL=%DISTRIBUTION_URL:\:=%"
for %%F in ("%DISTRIBUTION_URL%") do set "DISTRIBUTION_FILE=%%~nxF"
set "DISTRIBUTION_NAME=%DISTRIBUTION_FILE:.zip=%"
set "GRADLE_HOME=%APP_HOME%.gradle-bootstrap\%DISTRIBUTION_NAME%"
set "GRADLE_BIN=%GRADLE_HOME%\bin\gradle.bat"

if not exist "%GRADLE_BIN%" (
  set "TMP_DIR=%APP_HOME%.gradle-bootstrap\tmp"
  set "ARCHIVE_PATH=%TMP_DIR%\%DISTRIBUTION_FILE%"
  set "EXTRACT_DIR=%TMP_DIR%\extract"

  if not exist "%TMP_DIR%" mkdir "%TMP_DIR%"
  if exist "%EXTRACT_DIR%" rmdir /s /q "%EXTRACT_DIR%"
  mkdir "%EXTRACT_DIR%"

  powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -UseBasicParsing '%DISTRIBUTION_URL%' -OutFile '%ARCHIVE_PATH%'; Expand-Archive -LiteralPath '%ARCHIVE_PATH%' -DestinationPath '%EXTRACT_DIR%' -Force"
  if errorlevel 1 exit /b 1

  for /d %%D in ("%EXTRACT_DIR%\*") do (
    if not defined EXTRACTED_HOME set "EXTRACTED_HOME=%%~fD"
  )

  if not defined EXTRACTED_HOME (
    echo ERROR: Failed to extract Gradle distribution.
    exit /b 1
  )

  if exist "%GRADLE_HOME%" rmdir /s /q "%GRADLE_HOME%"
  move "%EXTRACTED_HOME%" "%GRADLE_HOME%" >nul
)

call "%GRADLE_BIN%" %*
