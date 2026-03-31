# BUILD

npm install   - w root folderze

npm install -D @tailwindcss/vite

npm run dev   - Uruchomienie Strony

#Serwer

sudo npm install -g pm2

pm2 start npm --name "website_name" -- run dev -- --host

Sprawdzenie czy serwer działa: pm2 list

Logi consoli: pm2 logs website_name.

Wyłącz strone: pm2 stop website

Zrestartuj strone: pm2 restart website
