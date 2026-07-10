@echo off
git add .
git commit -m "Auto-deploy: %date% %time%"
git push origin main
echo Deployment pushed to GitHub!
pause