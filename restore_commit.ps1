# Script pour restaurer le commit dsfbdb
# Hash du commit : 988734494c81f6c8d4cd6b89285c93862f261ba4

Write-Host "Restauration du commit dsfbdb..." -ForegroundColor Green

# Essayer de trouver git
$gitPath = Get-Command git -ErrorAction SilentlyContinue

if ($gitPath) {
    Write-Host "Git trouvé !" -ForegroundColor Green
    
    # Changer vers le répertoire du projet
    $projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
    Set-Location $projectPath
    
    # Faire le checkout
    Write-Host "Checkout du commit 9887344..." -ForegroundColor Yellow
    & git checkout 988734494c81f6c8d4cd6b89285c93862f261ba4
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Commit restauré avec succès !" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur lors du checkout" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Git n'est pas trouvé dans le PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Veuillez utiliser GitHub Desktop ou installer Git." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative : Téléchargez le ZIP depuis :" -ForegroundColor Cyan
    Write-Host "https://github.com/leandreLB/FlagCheck/archive/988734494c81f6c8d4cd6b89285c93862f261ba4.zip" -ForegroundColor Cyan
}




