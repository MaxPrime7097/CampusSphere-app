"""
Script de vérification de la configuration de la base de données Supabase
Usage: python check_database_setup.py
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
from django.core.management import call_command
from django.apps import apps
from decouple import config as env_config

def check_env_file():
    """Vérifie si le fichier .env existe"""
    env_path = BASE_DIR / '.env'
    if not env_path.exists():
        print("❌ ERREUR: Le fichier .env n'existe pas !")
        print(f"   Créez un fichier .env dans {BASE_DIR}")
        return False
    
    print("✅ Fichier .env trouvé")
    return True

def check_database_url():
    """Vérifie que DATABASE_URL est défini"""
    database_url = env_config('DATABASE_URL', default=None)
    if not database_url:
        print("❌ ERREUR: DATABASE_URL n'est pas défini dans .env")
        print("   Ajoutez DATABASE_URL dans votre fichier .env")
        return False
    
    print("✅ DATABASE_URL est défini")
    # Masquer le mot de passe dans l'affichage
    if '@' in database_url and ':' in database_url:
        parts = database_url.split('@')
        if len(parts) == 2:
            masked_url = parts[0].split(':')[0] + ':***@' + parts[1]
            print(f"   URL: {masked_url}")
    return True

def check_database_connection():
    """Vérifie la connexion à la base de données"""
    try:
        print("\n🔌 Test de connexion à Supabase...")
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()[0]
            print(f"✅ Connexion réussie !")
            print(f"   Version PostgreSQL: {version[:50]}...")
            return True
    except Exception as e:
        print(f"❌ ERREUR de connexion: {e}")
        return False

def check_migrations():
    """Vérifie si les migrations ont été exécutées"""
    try:
        print("\n📋 Vérification des migrations...")
        
        # Vérifier si la table django_migrations existe
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'django_migrations'
                );
            """)
            migrations_table_exists = cursor.fetchone()[0]
            
            if not migrations_table_exists:
                print("❌ ERREUR: La table django_migrations n'existe pas")
                print("   Exécutez: python manage.py migrate")
                return False
            
            # Compter les migrations appliquées
            cursor.execute("SELECT COUNT(*) FROM django_migrations;")
            count = cursor.fetchone()[0]
            print(f"✅ {count} migrations appliquées")
            
            # Vérifier si la table users_user existe
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'users_user'
                );
            """)
            users_table_exists = cursor.fetchone()[0]
            
            if not users_table_exists:
                print("❌ ERREUR: La table users_user n'existe pas")
                print("   Exécutez: python manage.py migrate")
                return False
            
            print("✅ Table users_user existe")
            return True
            
    except Exception as e:
        print(f"❌ ERREUR lors de la vérification des migrations: {e}")
        return False

def check_user_model():
    """Vérifie que le modèle User peut être utilisé"""
    try:
        print("\n👤 Vérification du modèle User...")
        from users.models import User
        
        # Compter les utilisateurs existants
        user_count = User.objects.count()
        print(f"✅ Modèle User accessible ({user_count} utilisateurs dans la base)")
        
        # Vérifier que le modèle peut créer un utilisateur (sans le sauvegarder)
        try:
            test_user = User(
                email='test@example.com',
                username='testuser',
                first_name='Test',
                last_name='User'
            )
            # Ne pas sauvegarder, juste vérifier que le modèle est valide
            print("✅ Modèle User valide")
        except Exception as e:
            print(f"❌ ERREUR: Le modèle User a un problème: {e}")
            return False
        
        return True
    except Exception as e:
        print(f"❌ ERREUR lors de la vérification du modèle User: {e}")
        return False

def test_user_creation():
    """Teste la création d'un utilisateur (sans le sauvegarder)"""
    try:
        print("\n🧪 Test de création d'utilisateur...")
        from users.models import User
        from users.serializers import UserRegistrationSerializer
        
        # Données de test
        test_data = {
            'first_name': 'Test',
            'last_name': 'User',
            'username': 'testuser123',
            'email': 'test123@example.com',
            'password': 'testpassword123',
            'confirm_password': 'testpassword123',
            'university': 'Test University',
            'faculty': 'Test Faculty',
            'study_year': 'L3'
        }
        
        # Créer le serializer
        serializer = UserRegistrationSerializer(data=test_data)
        if serializer.is_valid():
            print("✅ Serializer d'inscription valide")
            print("   Les données de test sont acceptées")
            return True
        else:
            print(f"❌ ERREUR: Le serializer a des erreurs: {serializer.errors}")
            return False
            
    except Exception as e:
        print(f"❌ ERREUR lors du test de création: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("=" * 60)
    print("Vérification de la configuration Supabase")
    print("=" * 60)
    print()
    
    all_checks = []
    
    # Vérifier le fichier .env
    all_checks.append(check_env_file())
    
    # Vérifier DATABASE_URL
    all_checks.append(check_database_url())
    
    # Vérifier la connexion
    all_checks.append(check_database_connection())
    
    # Vérifier les migrations
    all_checks.append(check_migrations())
    
    # Vérifier le modèle User
    all_checks.append(check_user_model())
    
    # Tester la création d'utilisateur
    all_checks.append(test_user_creation())
    
    print()
    print("=" * 60)
    
    if all(all_checks):
        print("✅ Tous les tests sont passés !")
        print("=" * 60)
        print("\nVotre configuration est correcte.")
        print("Si vous avez toujours des problèmes d'inscription, vérifiez :")
        print("  1. Les logs du serveur Django")
        print("  2. Les erreurs dans la console du navigateur")
        print("  3. La réponse de l'API lors de l'inscription")
    else:
        print("❌ Certains tests ont échoué")
        print("=" * 60)
        print("\nCorrigez les erreurs ci-dessus avant de continuer.")
        sys.exit(1)

if __name__ == '__main__':
    main()

