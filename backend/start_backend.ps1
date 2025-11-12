# Script PowerShell pour démarrer le backend CampusSphere

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CampusSphere Backend - Demarrage" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Activer l'environnement virtuel
Write-Host "[1/4] Activation de l'environnement virtuel..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Vérifier les dépendances
Write-Host "[2/4] Vérification des dépendances..." -ForegroundColor Yellow
pip install -r requirements.txt --quiet

# Appliquer les migrations
Write-Host "[3/4] Application des migrations..." -ForegroundColor Yellow
python manage.py migrate

# Démarrer le serveur
Write-Host "[4/4] Démarrage du serveur..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Serveur accessible sur:" -ForegroundColor Green
Write-Host "  http://127.0.0.1:8000/" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

python manage.py runserver

