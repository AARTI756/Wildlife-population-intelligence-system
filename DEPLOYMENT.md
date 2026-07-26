# Production Deployment Guide

Follow these instructions to deploy the Wildlife Population Intelligence System (WPIS) to production.

---

## 🐋 Containerized Deployment

Using Docker Compose is the recommended path for production deployments:

### 1. Build Production Images
```bash
docker-compose build
```

### 2. Startup Containers
```bash
docker-compose up -d
```
This initializes:
- A PostgreSQL container mapping database tables.
- A Uvicorn container running the backend FastAPI web application on port `8000`.

---

## ☁️ Cloud Hosting Steps (AWS / Azure)

1. **Host VM Provisioning**: Set up an EC2 or virtual machine running Ubuntu Server.
2. **Install Docker Engine**: Install docker and docker-compose.
3. **SSL Setup**: Install Nginx as a reverse proxy and configure Let's Encrypt Certbot:
   ```nginx
   server {
       listen 443 ssl;
       server_name wpis.reserve.gov.in;
       location /api/ {
           proxy_pass http://localhost:8000/;
       }
       location / {
           root /var/www/frontend/dist;
           try_files $uri $uri/ /index.html;
       }
   }
   ```
4. **Environment Variables**: Configure a production-safe `.env` file containing database passwords and JWT secrets.
