@echo off
echo ========================================
echo Restauration SURE du commit dsfbdb
echo ========================================
echo.

REM Sauvegarder la branche actuelle d'abord
echo [1/3] Creation d'une branche de sauvegarde...
git branch sauvegarde-avant-restore 2>nul
if %errorlevel% neq 0 (
    echo ATTENTION: Git n'est pas accessible.
    echo.
    echo Veuillez utiliser GitHub Desktop:
    echo 1. Ouvrez GitHub Desktop
    echo 2. History -^> Clic droit sur "dsfbdb"
    echo 3. "Create branch from commit"
    echo.
    pause
    exit /b 1
)

echo [OK] Branche de sauvegarde creee: sauvegarde-avant-restore
echo.

echo [2/3] Checkout du commit dsfbdb...
git checkout 988734494c81f6c8d4cd6b89285c93862f261ba4
if %errorlevel% neq 0 (
    echo ERREUR lors du checkout
    pause
    exit /b 1
)

echo [OK] Commit restaure!
echo.
echo [3/3] Termine!
echo.
echo ========================================
echo Vos fichiers ont ete restaures.
echo.
echo Pour revenir a votre version actuelle:
echo   git checkout sauvegarde-avant-restore
echo.
echo Ou dans GitHub Desktop: basculez sur la branche "sauvegarde-avant-restore"
echo ========================================
echo.
pause


