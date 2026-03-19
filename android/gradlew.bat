@echo off
setlocal
set APP_HOME=%~dp0
set GRADLE_VERSION=9.3.1
set DIST_NAME=gradle-%GRADLE_VERSION%-bin.zip
set DIST_URL=https://services.gradle.org/distributions/%DIST_NAME%
set CACHE_ROOT=%USERPROFILE%\.gradle\wrapper\dists\gradle-%GRADLE_VERSION%-bin\text-bootstrap
set ZIP_PATH=%CACHE_ROOT%\%DIST_NAME%
set INSTALL_DIR=%CACHE_ROOT%\gradle-%GRADLE_VERSION%

if not exist "%CACHE_ROOT%" mkdir "%CACHE_ROOT%"
if not exist "%INSTALL_DIR%\bin\gradle.bat" (
  if not exist "%ZIP_PATH%" (
    powershell -Command "Invoke-WebRequest -Uri '%DIST_URL%' -OutFile '%ZIP_PATH%'"
  )
  if exist "%INSTALL_DIR%" rmdir /S /Q "%INSTALL_DIR%"
  powershell -Command "Expand-Archive -Path '%ZIP_PATH%' -DestinationPath '%CACHE_ROOT%' -Force"
)

call "%INSTALL_DIR%\bin\gradle.bat" -p "%APP_HOME%" %*
