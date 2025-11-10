# Script simple pour ajouter l'entrée Supabase dans le fichier hosts
# ⚠️ IMPORTANT: Exécutez ce script en tant qu'administrateur

$hostname = "db.hhgjweyhvbwfzmltobti.supabase.co"
$ipv6 = "2a05:d018:135e:1614:1485:27bc:eefc:3fd8"
$hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"

Write-Host "Ajout de l'entrée dans le fichier hosts..." -ForegroundColor Cyan
Write-Host "  $ipv6`t$hostname" -ForegroundColor White

# Vérifier si l'entrée existe déjà
$hostsContent = Get-Content $hostsPath -ErrorAction SilentlyContinue
if ($hostsContent | Select-String -Pattern $hostname) {
    Write-Host "⚠️  L'entrée existe déjà. Suppression de l'ancienne entrée..." -ForegroundColor Yellow
    $newContent = $hostsContent | Where-Object { $_ -notmatch $hostname }
    $newContent | Set-Content $hostsPath -Force
}

# Ajouter la nouvelle entrée
Add-Content -Path $hostsPath -Value "`n# Supabase Database" -Force
Add-Content -Path $hostsPath -Value "$ipv6`t$hostname" -Force

Write-Host "✅ Entrée ajoutée avec succès !" -ForegroundColor Green

# Vider le cache DNS
ipconfig /flushdns | Out-Null
Write-Host "✅ Cache DNS vidé" -ForegroundColor Green

Write-Host ""
Write-Host "Testez maintenant :" -ForegroundColor Yellow
Write-Host "  python manage.py check --database default" -ForegroundColor White

