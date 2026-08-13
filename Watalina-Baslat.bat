@echo off
setlocal enabledelayedexpansion
title Watalina Baslatiliyor...
cd /d "%~dp0"

echo ============================================
echo   Watalina Satis ve Servis Sistemi
echo ============================================
echo Calisma klasoru: %cd%
echo.

REM -- Zip'ten dogrudan calistirilmis mi kontrolu --
echo %cd% | findstr /i "\Temp\" >nul
if not errorlevel 1 (
    echo [UYARI] Bu klasor gecici bir Temp klasoru gibi gorunuyor.
    echo Zip dosyasini once TAM olarak bir klasore CIKARTIN
    echo ^(sag tik - Tumunu Cikart / Extract All^), sonra icinden calistirin.
    echo.
    pause
)

REM -- Node.js kurulu mu? --
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [HATA] Node.js bulunamadi!
    echo.
    echo Lutfen once https://nodejs.org adresinden
    echo Node.js LTS surumunu indirip kurun, bilgisayari yeniden baslatin,
    echo sonra bu dosyayi tekrar calistirin.
    echo.
    pause
    exit /b 1
)

echo Node.js surumu:
node -v
echo npm surumu:
npm -v
echo.

REM -- Veritabani icin sabit, proje disi klasor --
set "WATALINA_DATA=%USERPROFILE%\WatalinaData"
if not exist "%WATALINA_DATA%" mkdir "%WATALINA_DATA%"
set "DB_PATH=%WATALINA_DATA%\watalina.db"
echo Veritabani konumu: %DB_PATH%
echo.

REM -- Bagimliliklar eksik veya bozuksa (yeniden) kur --
set "NEED_INSTALL=0"
if not exist "node_modules" set "NEED_INSTALL=1"
if not exist "node_modules\express" set "NEED_INSTALL=1"
if not exist "node_modules\better-sqlite3" set "NEED_INSTALL=1"

if "!NEED_INSTALL!"=="1" (
    echo Bagimliliklar kuruluyor / onariliyor, bu birkac dakika surebilir...
    echo Detayli log: install-log.txt dosyasina yaziliyor.
    echo.
    call npm install > install-log.txt 2>&1
    if !errorlevel! neq 0 (
        echo.
        echo [HATA] npm install basarisiz oldu.
        echo Detaylar icin ayni klasordeki install-log.txt dosyasini acin.
        echo En alttaki birkac satiri buraya kopyalayip gonderin:
        echo.
        type install-log.txt
        echo.
        pause
        exit /b 1
    )
    echo Kurulum tamamlandi.
    echo.
)

REM -- Sunucuyu bu pencerede baslat (hata varsa direkt gorunur) --
echo Sunucu baslatiliyor... ^(bu pencereyi KAPATMAYIN^)
echo Tarayici birazdan otomatik acilacak.
echo.

start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

set DB_PATH=%DB_PATH%
node server.js

echo.
echo [BILGI] Sunucu durdu. Yukarida hata mesaji varsa onu inceleyin.
pause
