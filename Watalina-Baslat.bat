@echo off
setlocal enabledelayedexpansion
title Watalina Baslatiliyor...
cd /d "%~dp0"

echo ============================================
echo   Watalina Satis ve Servis Sistemi
echo ============================================
echo.

REM ── Node.js kurulu mu? ──────────────────────────────
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [HATA] Node.js bulunamadi!
    echo.
    echo Lutfen once https://nodejs.org adresinden
    echo Node.js LTS surumunu indirip kurun.
    echo Kurulumdan sonra bu dosyayi tekrar calistirin.
    echo.
    pause
    exit /b 1
)

REM ── Veritabani icin sabit, proje disi klasor ─────────
REM Proje klasoru silinse/degistirilse bile veri burada kalir.
set "WATALINA_DATA=%USERPROFILE%\WatalinaData"
if not exist "%WATALINA_DATA%" mkdir "%WATALINA_DATA%"
set "DB_PATH=%WATALINA_DATA%\watalina.db"

echo Veritabani konumu: %DB_PATH%
echo.

REM ── Bagimliliklar (sadece ilk calistirmada) ──────────
if not exist "node_modules" (
    echo Ilk kurulum yapiliyor, bu birkac dakika surebilir...
    echo.
    call npm install
    if !errorlevel! neq 0 (
        echo.
        echo [HATA] Kurulum basarisiz oldu. Internet baglantinizi kontrol edin.
        pause
        exit /b 1
    )
    echo.
    echo Kurulum tamamlandi.
    echo.
)

REM ── Sunucuyu ayri pencerede baslat, sonra tarayiciyi ac ──
echo Sunucu baslatiliyor...
start "Watalina Sunucu - KAPATMAYIN" cmd /k "set DB_PATH=%DB_PATH% && node server.js"

timeout /t 3 /nobreak >nul
start "" http://localhost:3000

echo.
echo Watalina tarayicida acildi.
echo Uygulamayi kapatmak icin acilan "Watalina Sunucu" penceresini kapatin.
echo.
pause
