@echo off
echo Starting Smart Helpdesk...

echo Stopping any existing containers...
docker-compose down

echo Starting services...
docker-compose up -d

echo Waiting for services to start...
timeout /t 30

echo Seeding database...
docker-compose exec -T backend npm run seed

echo.
echo ========================================
echo Smart Helpdesk is ready!
echo ========================================
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:3000
echo Health:   http://localhost:3000/healthz
echo.
echo Test Accounts:
echo Admin: admin@helpdesk.com / admin123
echo Agent: agent@helpdesk.com / agent123
echo User:  user@helpdesk.com / user123
echo ========================================

pause