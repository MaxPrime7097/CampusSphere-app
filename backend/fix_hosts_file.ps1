# Script PowerShell pour ajouter l'entrée Supabase dans le fichier hosts
# ⚠️ IMPORTANT: Exécutez ce script en tant qu'administrateur

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuration du fichier hosts pour Supabase" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier les privilèges administrateur
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ ERREUR: Ce script doit être exécuté en tant qu'administrateur !" -ForegroundColor Red
    Write-Host ""
    Write-Host "Pour exécuter en tant qu'administrateur :" -ForegroundColor Yellow
    Write-Host "1. Clic droit sur PowerShell" -ForegroundColor Yellow
    Write-Host "2. Sélectionnez 'Exécuter en tant qu'administrateur'" -ForegroundColor Yellow
    Write-Host "3. Naviguez vers le dossier backend" -ForegroundColor Yellow
    Write-Host "4. Exécutez: .\fix_hosts_file.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Privilèges administrateur confirmés" -ForegroundColor Green
Write-Host ""

# Demander le hostname Supabase
$hostname = Read-Host "Entrez le hostname Supabase (ex: db.hhgjweyhvbwfzmltobti.supabase.co)"

if ([string]::IsNullOrWhiteSpace($hostname)) {
    Write-Host "❌ ERREUR: Le hostname ne peut pas être vide" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔍 Résolution de l'adresse IPv6 pour $hostname..." -ForegroundColor Cyan

# Résoudre l'adresse IPv6
try {
    $result = nslookup $hostname 8.8.8.8 2>&1 | Select-String -Pattern "Address:" | Select-Object -Last 1
    
    if ($result -match "Address:\s+([a-f0-9:]+)") {
        $ipv6 = $matches[1]
        Write-Host "✅ Adresse IPv6 trouvée: $ipv6" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Impossible de résoudre l'adresse IPv6 automatiquement" -ForegroundColor Yellow
        $ipv6 = Read-Host "Entrez l'adresse IPv6 manuellement (ou appuyez sur Entrée pour utiliser l'IPv6 résolue)"
        
        if ([string]::IsNullOrWhiteSpace($ipv6)) {
            Write-Host "❌ ERREUR: L'adresse IPv6 est requise" -ForegroundColor Red
            exit 1
        }
    }
} catch {
    Write-Host "❌ ERREUR lors de la résolution DNS: $_" -ForegroundColor Red
    $ipv6 = Read-Host "Entrez l'adresse IPv6 manuellement"
    
    if ([string]::IsNullOrWhiteSpace($ipv6)) {
        Write-Host "❌ ERREUR: L'adresse IPv6 est requise" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Chemin du fichier hosts
$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"

# Vérifier si l'entrée existe déjà
$hostsContent = Get-Content $hostsPath -ErrorAction SilentlyContinue
$entryExists = $hostsContent | Select-String -Pattern $hostname

if ($entryExists) {
    Write-Host "⚠️  Une entrée pour $hostname existe déjà dans le fichier hosts" -ForegroundColor Yellow
    $response = Read-Host "Voulez-vous la remplacer ? (O/N)"
    
    if ($response -eq "O" -or $response -eq "o") {
        # Supprimer l'ancienne entrée
        $newContent = $hostsContent | Where-Object { $_ -notmatch $hostname }
        $newContent | Set-Content $hostsPath -Force
        Write-Host "✅ Ancienne entrée supprimée" -ForegroundColor Green
    } else {
        Write-Host "❌ Opération annulée" -ForegroundColor Red
        exit 0
    }
}

# Ajouter la nouvelle entrée
Write-Host ""
Write-Host "📝 Ajout de l'entrée dans le fichier hosts..." -ForegroundColor Cyan

try {
    # Ajouter l'entrée avec IPv6
    Add-Content -Path $hostsPath -Value "`n# Supabase Database - Added by fix_hosts_file.ps1" -Force
    Add-Content -Path $hostsPath -Value "$ipv6`t$hostname" -Force
    
    Write-Host "✅ Entrée ajoutée avec succès !" -ForegroundColor Green
    Write-Host ""
    Write-Host "   $ipv6`t$hostname" -ForegroundColor White
    Write-Host ""
    
    # Vider le cache DNS
    Write-Host "🔄 Vidage du cache DNS..." -ForegroundColor Cyan
    ipconfig /flushdns | Out-Null
    Write-Host "✅ Cache DNS vidé" -ForegroundColor Green
    Write-Host ""
    
    # Tester la résolution
    Write-Host "🧪 Test de résolution..." -ForegroundColor Cyan
    try {
        $testResult = [System.Net.Dns]::GetHostAddresses($hostname)
        Write-Host "✅ Résolution réussie !" -ForegroundColor Green
        Write-Host "   Adresse résolue: $($testResult[0].IPAddressToString)" -ForegroundColor White
    } catch {
        Write-Host "⚠️  La résolution peut prendre quelques secondes..." -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Configuration terminée !" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Vous pouvez maintenant tester la connexion :" -ForegroundColor Yellow
    Write-Host "  python manage.py check --database default" -ForegroundColor White
    Write-Host "  python manage.py migrate" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  NOTE: Si vous changez de projet Supabase, vous devrez" -ForegroundColor Yellow
    Write-Host "   mettre à jour cette entrée dans le fichier hosts." -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ ERREUR lors de l'écriture du fichier hosts: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Solution manuelle :" -ForegroundColor Yellow
    Write-Host "1. Ouvrez Notepad en tant qu'administrateur" -ForegroundColor White
    Write-Host "2. Ouvrez le fichier: C:\Windows\System32\drivers\etc\hosts" -ForegroundColor White
    Write-Host "3. Ajoutez cette ligne à la fin :" -ForegroundColor White
    Write-Host "   $ipv6`t$hostname" -ForegroundColor Cyan
    Write-Host "4. Sauvegardez et fermez" -ForegroundColor White
    exit 1
}

