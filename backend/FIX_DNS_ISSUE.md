# Solution au problème de résolution DNS Supabase

## Problème identifié

Votre DNS local ne peut pas résoudre le hostname Supabase `db.clxcuiuixqausvouwnmj.supabase.co`, mais Google DNS (8.8.8.8) peut le résoudre.

**⚠️ IMPORTANT :** Même si `nslookup` fonctionne avec Google DNS, Python/psycopg2 utilise le DNS système, qui ne fonctionne pas correctement. Vous devez changer le DNS système.

## Solutions

### Solution 1 : Script automatique (RECOMMANDÉ - Le plus rapide)

**Exécutez le script PowerShell fourni :**

1. Ouvrez PowerShell en tant qu'**administrateur** :
   - Clic droit sur PowerShell
   - Sélectionnez "Exécuter en tant qu'administrateur"

2. Naviguez vers le dossier backend :
   ```powershell
   cd C:\Users\lione\CampusSphere-MVP-v1-updated\backend
   ```

3. Exécutez le script :
   ```powershell
   .\fix_dns.ps1
   ```

Le script va :
- Configurer Google DNS (8.8.8.8 et 8.8.4.4) sur votre interface réseau
- Vider le cache DNS
- Tester la résolution DNS

### Solution 2 : Changer le DNS manuellement (Alternative)

**Sur Windows :**

1. Ouvrez **Paramètres** > **Réseau et Internet** > **Paramètres réseau avancés**
2. Cliquez sur **Modifier les options de l'adaptateur**
3. Cliquez avec le bouton droit sur votre connexion réseau active (Wi-Fi ou Ethernet)
4. Sélectionnez **Propriétés**
5. Sélectionnez **Protocole Internet version 4 (TCP/IPv4)** et cliquez sur **Propriétés**
6. Sélectionnez **Utiliser l'adresse de serveur DNS suivante**
7. Entrez :
   - **Serveur DNS préféré** : `8.8.8.8` (Google DNS)
   - **Serveur DNS auxiliaire** : `8.8.4.4` (Google DNS) ou `1.1.1.1` (Cloudflare)
8. Cliquez sur **OK** et fermez toutes les fenêtres
9. **Redémarrez votre ordinateur** ou exécutez dans PowerShell (en tant qu'administrateur) :
   ```powershell
   ipconfig /flushdns
   ```

**Alternative rapide (sans redémarrer) :**

1. Ouvrez PowerShell en tant qu'**administrateur**
2. Exécutez :
   ```powershell
   # Vider le cache DNS
   ipconfig /flushdns
   
   # Redémarrer le service DNS
   Restart-Service -Name Dnscache
   ```

### Solution 2 : Utiliser un DNS temporaire pour Python uniquement

Si vous ne voulez pas changer le DNS système, vous pouvez configurer Python pour utiliser un DNS spécifique. Cependant, cela nécessite des modifications plus complexes.

### Solution 3 : Vérifier que le projet Supabase est actif

1. Allez sur https://app.supabase.com
2. Vérifiez que votre projet est actif (pas en pause)
3. Si le projet est en pause, réactivez-le

### Solution 4 : Vérifier votre connexion Internet et pare-feu

1. Vérifiez que vous pouvez accéder à d'autres sites web
2. Vérifiez que votre pare-feu n'bloque pas les requêtes DNS
3. Essayez de désactiver temporairement votre antivirus/pare-feu pour tester

## Test après correction

Après avoir changé le DNS, testez :

```powershell
# Tester la résolution DNS
nslookup db.clxcuiuixqausvouwnmj.supabase.co

# Si ça fonctionne, testez la connexion Django
python manage.py check --database default

# Si tout fonctionne, exécutez les migrations
python manage.py migrate
```

## Vérification rapide

Pour vérifier rapidement si le problème est résolu :

```powershell
# Tester avec Google DNS directement
nslookup db.clxcuiuixqausvouwnmj.supabase.co 8.8.8.8

# Si ça fonctionne, le problème vient bien de votre DNS local
```

## Note importante

Le hostname Supabase se résout correctement avec Google DNS, ce qui confirme que :
- ✅ Le hostname est correct
- ✅ Le projet Supabase existe
- ❌ Votre DNS local ne peut pas le résoudre

La solution la plus simple est de changer votre DNS pour utiliser Google DNS (8.8.8.8) ou Cloudflare DNS (1.1.1.1).

