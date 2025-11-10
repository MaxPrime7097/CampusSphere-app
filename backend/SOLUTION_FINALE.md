# ✅ Solution finale pour le problème DNS Supabase

## Problème identifié

Python/psycopg2 ne peut pas résoudre le hostname Supabase via le DNS système Windows, même si `nslookup` fonctionne avec Google DNS. C'est un problème connu avec Windows et IPv6.

## Solution : Utiliser le fichier hosts Windows

La solution la plus fiable est d'ajouter l'entrée Supabase directement dans le fichier `hosts` de Windows.

### Option 1 : Script automatique (RECOMMANDÉ)

1. **Ouvrez PowerShell en tant qu'administrateur** :
   - Clic droit sur PowerShell
   - Sélectionnez "Exécuter en tant qu'administrateur"

2. **Naviguez vers le dossier backend** :
   ```powershell
   cd C:\Users\lione\CampusSphere-MVP-v1-updated\backend
   ```

3. **Exécutez le script** :
   ```powershell
   .\add_hosts_entry.ps1
   ```

Le script va :
- Ajouter l'entrée `2a05:d018:135e:1614:1485:27bc:eefc:3fd8 db.hhgjweyhvbwfzmltobti.supabase.co` dans le fichier hosts
- Vider le cache DNS
- Vous permettre de tester la connexion

### Option 2 : Modification manuelle du fichier hosts

Si le script ne fonctionne pas :

1. **Ouvrez Notepad en tant qu'administrateur** :
   - Clic droit sur Notepad
   - Sélectionnez "Exécuter en tant qu'administrateur"

2. **Ouvrez le fichier hosts** :
   - Fichier > Ouvrir
   - Naviguez vers : `C:\Windows\System32\drivers\etc\hosts`
   - Changez le filtre de "Documents texte (*.txt)" à "Tous les fichiers (*.*)"

3. **Ajoutez cette ligne à la fin du fichier** :
   ```
   2a05:d018:135e:1614:1485:27bc:eefc:3fd8    db.hhgjweyhvbwfzmltobti.supabase.co
   ```

4. **Sauvegardez et fermez**

5. **Videz le cache DNS** :
   ```powershell
   ipconfig /flushdns
   ```

### Option 3 : Script interactif (si vous changez de projet)

Si vous changez de projet Supabase et avez besoin d'un nouveau hostname :

1. **Ouvrez PowerShell en tant qu'administrateur**

2. **Naviguez vers le dossier backend** :
   ```powershell
   cd C:\Users\lione\CampusSphere-MVP-v1-updated\backend
   ```

3. **Exécutez le script interactif** :
   ```powershell
   .\fix_hosts_file.ps1
   ```

Le script va vous demander le hostname et résoudre automatiquement l'adresse IPv6.

## Test après configuration

Après avoir ajouté l'entrée dans le fichier hosts :

```powershell
# Tester la résolution DNS
python -c "import socket; print(socket.gethostbyname('db.hhgjweyhvbwfzmltobti.supabase.co'))"

# Si ça fonctionne, tester la connexion Django
python manage.py check --database default

# Si tout fonctionne, exécuter les migrations
python manage.py migrate
```

## Vérification

Pour vérifier que l'entrée a été ajoutée correctement :

```powershell
Get-Content C:\Windows\System32\drivers\etc\hosts | Select-String -Pattern "supabase"
```

Vous devriez voir :
```
2a05:d018:135e:1614:1485:27bc:eefc:3fd8    db.hhgjweyhvbwfzmltobti.supabase.co
```

## ⚠️ Important

- Si vous changez de projet Supabase, vous devrez mettre à jour l'entrée dans le fichier hosts
- L'adresse IPv6 peut changer, donc si la connexion ne fonctionne plus, vérifiez l'IP avec `nslookup`
- Cette solution fonctionne pour tous les projets Supabase

## Pourquoi cette solution fonctionne

Le fichier `hosts` de Windows est consulté AVANT le DNS système. En ajoutant l'entrée directement, Windows résoudra le hostname localement sans passer par le DNS, ce qui contourne le problème de résolution DNS.

---

**Après avoir exécuté le script, testez immédiatement :**
```powershell
python manage.py check --database default
```

Si ça fonctionne, vous pouvez exécuter les migrations :
```powershell
python manage.py migrate
```

