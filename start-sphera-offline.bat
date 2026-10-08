@echo off
chcp 65001 >nul
title Sphera Live - Serveur Local Hors-Ligne
color 0A

echo ======================================================================
echo           SPHERA LIVE - MODE HORS-LIGNE / RÉSEAU LOCAL (LAN)
echo ======================================================================
echo.

rem Détection de l'adresse IP locale du PC (Wi-Fi / Hotspot / Ethernet)
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -match '^(192\.168|10\.|172\.)' -and $_.InterfaceAlias -notmatch 'VirtualBox|VMware|Loopback' } | Select-Object -First 1).IPAddress"`) do set LOCAL_IP=%%i

if "%LOCAL_IP%"=="" (
    set LOCAL_IP=127.0.0.1
)

echo [✓] Adresse IP Locale détectée : %LOCAL_IP%
echo.
echo [1] Les participants connectés au même Wi-Fi ou Hotspot doivent ouvrir :
echo     --> http://%LOCAL_IP%:5174/live/join
echo     (Ou scanner le QR Code géant affiché sur l'écran de l'hôte)
echo.
echo [2] Écran de projection pour l'enseignant / hôte :
echo     --> http://localhost:5174/live/host
echo.
echo ======================================================================
echo Lancement des services locaux (Backend Port 3000 + Frontend Port 5174)...
echo ======================================================================

rem Démarrage du backend et du frontend Sphera dans des processus dédiés
start "Sphera Backend (:3000)" cmd /k "cd /d apps\backend && pnpm dev"
timeout /t 2 /nobreak >nul
start "Sphera Frontend (:5174)" cmd /k "cd /d apps\sphera && pnpm dev --host"

timeout /t 3 /nobreak >nul
echo.
echo [✓] Services démarrés avec succès !
echo Ouverture automatique de l'interface Hôte dans le navigateur...
start http://localhost:5174/live/host

echo.
echo Gardez ces fenêtres ouvertes pendant la durée de la session de quiz.
echo.
