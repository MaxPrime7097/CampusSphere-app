"""
Script pour vérifier la connexion à Supabase
Usage: python check_supabase_connection.py
"""

import os
import sys
from pathlib import Path

# Ajouter le répertoire parent au path pour importer Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Configurer Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_sphere.settings')

import django
django.setup()

from django.db import connection
from decouple import config as env_config

def check_env_file():
    """Vérifie si le fichier .env existe"""
    env_path = BASE_DIR / '.env'
    if not env_path.exists():
        print("❌ ERREUR: Le fichier .env n'existe pas !")
        print(f"   Créez un fichier .env dans {BASE_DIR}")
        print("   Consultez SUPABASE_SETUP.md pour plus d'informations")
        return False
    
    print("✅ Fichier .env trouvé")
    return True

def check_env_variables():
    """Vérifie que toutes les variables d'environnement nécessaires sont définies"""
    required_vars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
    missing_vars = []
    
    for var in required_vars:
        value = env_config(var, default='')
        if not value or value == 'localhost' or value == 'postgres':
            if var == 'DB_PASSWORD' and not value:
                missing_vars.append(var)
            elif var == 'DB_HOST' and value == 'localhost':
                missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ ERREUR: Variables d'environnement manquantes ou incorrectes:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\n   Vérifiez votre fichier .env")
        return False
    
    print("✅ Toutes les variables d'environnement sont définies")
    return True

def check_dns_resolution():
    """Vérifie la résolution DNS du hostname Supabase"""
    import socket
    
    host = env_config('DB_HOST', default='localhost')
    
    if host == 'localhost':
        print("⚠️  DB_HOST est 'localhost' - impossible de vérifier DNS")
        return False
    
    try:
        print(f"🔍 Résolution DNS pour {host}...")
        ip = socket.gethostbyname(host)
        print(f"✅ DNS résolu: {host} -> {ip}")
        return True
    except socket.gaierror as e:
        print(f"❌ ERREUR DNS: Impossible de résoudre {host}")
        print(f"   Erreur: {e}")
        print("\n   Solutions possibles:")
        print("   1. Vérifiez que le hostname est correct dans Supabase")
        print("   2. Vérifiez que votre projet Supabase est actif (pas en pause)")
        print("   3. Vérifiez votre connexion Internet")
        return False

def check_database_connection():
    """Vérifie la connexion à la base de données"""
    try:
        print("\n🔌 Tentative de connexion à Supabase...")
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()[0]
            print(f"✅ Connexion réussie !")
            print(f"   Version PostgreSQL: {version[:50]}...")
            return True
    except Exception as e:
        print(f"❌ ERREUR de connexion: {e}")
        print("\n   Vérifiez:")
        print("   1. Le mot de passe dans votre fichier .env")
        print("   2. Le hostname dans votre fichier .env")
        print("   3. Que votre projet Supabase est actif")
        return False

def main():
    print("=" * 60)
    print("Vérification de la connexion Supabase")
    print("=" * 60)
    print()
    
    # Vérifier le fichier .env
    if not check_env_file():
        sys.exit(1)
    
    print()
    
    # Vérifier les variables d'environnement
    if not check_env_variables():
        sys.exit(1)
    
    print()
    
    # Vérifier la résolution DNS
    if not check_dns_resolution():
        sys.exit(1)
    
    print()
    
    # Vérifier la connexion à la base de données
    if not check_database_connection():
        sys.exit(1)
    
    print()
    print("=" * 60)
    print("✅ Tous les tests sont passés !")
    print("=" * 60)
    print("\nVous pouvez maintenant exécuter:")
    print("  python manage.py migrate")

if __name__ == '__main__':
    main()

