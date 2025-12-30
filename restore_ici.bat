@echo off
chcp 65001 >nul
echo ========================================
echo Restauration du commit dsfbdb
echo (dans le dossier actuel)
echo ========================================
echo.

REM Sauvegarder d'abord
echo [1/2] Creation d'une branche de sauvegarde...
git branch sauvegarde-actuelle 2>nul
echo [OK] Vos fichiers actuels sont sauvegardes dans la branche "sauvegarde-actuelle"
echo.

echo [2/2] Restauration du commit dsfbdb...
git checkout 9887344
if %errorlevel% neq 0 (
    echo.
    echo ERREUR: Git n'est pas accessible depuis ce script.
    echo.
    echo SOLUTION ALTERNATIVE dans Cursor:
    echo 1. Ouvrez le terminal integre dans Cursor (Ctrl+`)
    echo 2. Tapez: git checkout 9887344
    echo 3. Appuyez sur Entree
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Restauration terminee!
echo.
echo Pour revenir a votre version actuelle:
echo   git checkout sauvegarde-actuelle
echo.
echo ========================================
pause

