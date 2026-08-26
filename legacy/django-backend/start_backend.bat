@echo off
echo ========================================
echo   CampusSphere Backend - Demarrage
echo ========================================
echo.

REM Activer l'environnement virtuel
echo [1/4] Activation de l'environnement virtuel...
call venv\Scripts\activate.bat

REM Vérifier les dépendances
echo [2/4] Vérification des dépendances...
pip install -r requirements.txt --quiet

REM Appliquer les migrations
echo [3/4] Application des migrations...
python manage.py migrate

REM Démarrer le serveur
echo [4/4] Démarrage du serveur...
echo.
echo ========================================
echo   Serveur accessible sur:
echo   http://127.0.0.1:8000/
echo ========================================
echo.
python manage.py runserver

pause

