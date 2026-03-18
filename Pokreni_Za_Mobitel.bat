@echo off
echo Pronalazim lokalnu IP adresu...
for /f "tokens=14" %%a in ('ipconfig ^| findstr IPv4') do set _IP=%%a
echo.
echo ===================================================
echo 1. Pobrini se da su mobitel i kompjuter na ISTOJ Wi-Fi mrezi!
echo 2. Otvori preglednik (Chrome/Safari) na mobitelu i upisi:
echo.
echo    http://%_IP%:8000
echo.
echo ===================================================
echo.
echo [SERVER RADI] - Pritisni CTRL+C i napisi 'Y' za gasenje kada zavrsis.
python -m http.server 8000 --bind 0.0.0.0
pause
