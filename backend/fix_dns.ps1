# Script PowerShell pour changer le DNS vers Google DNS
# ⚠️ IMPORTANT: Exécutez ce script en tant qu'administrateur

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configuration DNS pour Supabase" -ForegroundColor Cyan
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
    Write-Host "4. Exécutez: .\fix_dns.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Privilèges administrateur confirmés" -ForegroundColor Green
Write-Host ""

# Obtenir les interfaces réseau actives
$adapters = Get-NetAdapter | Where-Object {$_.Status -eq "Up"}

if ($adapters.Count -eq 0) {
    Write-Host "❌ ERREUR: Aucune interface réseau active trouvée" -ForegroundColor Red
    exit 1
}

Write-Host "Interfaces réseau trouvées:" -ForegroundColor Cyan
foreach ($adapter in $adapters) {
    Write-Host "  - $($adapter.Name) ($($adapter.InterfaceDescription))" -ForegroundColor White
}
Write-Host ""

# Demander à l'utilisateur quelle interface configurer
if ($adapters.Count -gt 1) {
    Write-Host "Quelle interface voulez-vous configurer ?" -ForegroundColor Yellow
    for ($i = 0; $i -lt $adapters.Count; $i++) {
        Write-Host "  [$i] $($adapters[$i].Name)" -ForegroundColor White
    }
    $choice = Read-Host "Entrez le numéro (0-$($adapters.Count-1))"
    $selectedAdapter = $adapters[$choice]
} else {
    $selectedAdapter = $adapters[0]
    Write-Host "Configuration de l'interface: $($selectedAdapter.Name)" -ForegroundColor Cyan
}

Write-Host ""

# Configurer Google DNS
Write-Host "Configuration de Google DNS (8.8.8.8 et 8.8.4.4)..." -ForegroundColor Cyan

try {
    # Supprimer les anciens serveurs DNS
    $dnsServers = Get-DnsClientServerAddress -InterfaceIndex $selectedAdapter.InterfaceIndex -AddressFamily IPv4
    if ($dnsServers.ServerAddresses.Count -gt 0) {
        Write-Host "  Anciens DNS: $($dnsServers.ServerAddresses -join ', ')" -ForegroundColor Gray
    }
    
    # Configurer Google DNS
    Set-DnsClientServerAddress -InterfaceIndex $selectedAdapter.InterfaceIndex -ServerAddresses ("8.8.8.8", "8.8.4.4")
    
    Write-Host "✅ DNS configuré avec succès !" -ForegroundColor Green
    Write-Host "   Serveur DNS principal: 8.8.8.8 (Google DNS)" -ForegroundColor White
    Write-Host "   Serveur DNS secondaire: 8.8.4.4 (Google DNS)" -ForegroundColor White
    Write-Host ""
    
    # Vider le cache DNS
    Write-Host "Vidage du cache DNS..." -ForegroundColor Cyan
    ipconfig /flushdns | Out-Null
    Write-Host "✅ Cache DNS vidé" -ForegroundColor Green
    Write-Host ""
    
    # Tester la résolution DNS
    Write-Host "Test de résolution DNS pour Supabase..." -ForegroundColor Cyan
    $result = nslookup db.clxcuiuixqausvouwnmj.supabase.co 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Résolution DNS réussie !" -ForegroundColor Green
    } else {
        Write-Host "⚠️  La résolution DNS peut prendre quelques secondes..." -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Configuration terminée !" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Vous pouvez maintenant tester la connexion :" -ForegroundColor Yellow
    Write-Host "  python manage.py check --database default" -ForegroundColor White
    Write-Host "  python manage.py migrate" -ForegroundColor White
    
} catch {
    Write-Host "❌ ERREUR lors de la configuration DNS: $_" -ForegroundColor Red
    exit 1
}

