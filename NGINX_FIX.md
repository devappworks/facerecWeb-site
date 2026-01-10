# Nginx Configuration Fix for React Router

## Problem
React Router routes like `/training/dashboard` return 404 errors because nginx tries to find actual files at those paths.

## Solution
Add a `try_files` directive to the nginx config to serve `index.html` for all `/training/*` routes.

## Required Changes

Edit the file: `/etc/nginx/sites-available/photolytics.mpanel.app`

Add this location block inside the server block (before the closing brace):

```nginx
# React Router support for Training UI
location /training/ {
    try_files $uri $uri/ /training/index.html;
}
```

### Full Updated Server Block Should Look Like:

```nginx
server {
    server_name photolytics.mpanel.app;

    root /home/photolytics/public_html;
    index index.html;

    location ^~ /.well-known/acme-challenge {
        alias /var/www/html;
    }

    # React Router support for Training UI
    location /training/ {
        try_files $uri $uri/ /training/index.html;
    }

    access_log /home/facereco/logs/nginx/photolytics-access.log;
    error_log /home/facereco/logs/nginx/photolytics-error.log;

    listen 142.132.147.188:443 ssl;
    listen [::]:443 ssl ipv6only=on;
    ssl_certificate /etc/letsencrypt/live/photolytics.mpanel.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/photolytics.mpanel.app/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
```

## Steps to Apply

1. Edit the nginx config (requires sudo):
   ```bash
   sudo nano /etc/nginx/sites-available/photolytics.mpanel.app
   ```

2. Add the location block shown above

3. Test the configuration:
   ```bash
   sudo nginx -t
   ```

4. If test passes, reload nginx:
   ```bash
   sudo systemctl reload nginx
   ```

## What This Does

- **Before**: nginx looks for `/home/photolytics/public_html/training/dashboard` (doesn't exist) → 404
- **After**: nginx serves `/home/photolytics/public_html/training/index.html` → React Router handles the `/dashboard` route

## Test After Fix

All these URLs should work:
- https://photolytics.mpanel.app/training/
- https://photolytics.mpanel.app/training/dashboard
- https://photolytics.mpanel.app/training/workflow
- https://photolytics.mpanel.app/training/queue-management
