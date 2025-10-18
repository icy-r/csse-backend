# 🚀 Deployment Notes

## MongoDB Setup Required

**IMPORTANT:** Before starting the server, you must have MongoDB running and accessible.

### Option 1: Local MongoDB

#### Windows

1. Download MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Install with default settings
3. MongoDB will start automatically as a service
4. Default connection: `mongodb://localhost:27017`

#### macOS

```bash
brew tap mongodb/brew
brew install mongodb-community@6.0
brew services start mongodb-community@6.0
```

#### Linux (Ubuntu)

```bash
sudo apt-get install mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Verify MongoDB is Running

```bash
mongosh  # or mongo for older versions
# You should see: "Connected to: mongodb://127.0.0.1:27017"
```

### Option 2: MongoDB Atlas (Cloud - Recommended)

1. **Create Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for free

2. **Create Cluster**
   - Choose "Free Shared" tier
   - Select closest region
   - Click "Create Cluster"

3. **Create Database User**
   - Security → Database Access
   - Add New Database User
   - Choose password authentication
   - Save username and password

4. **Whitelist IP**
   - Security → Network Access
   - Add IP Address
   - Choose "Allow Access from Anywhere" (0.0.0.0/0) for development
   - Or add your specific IP

5. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database user password

6. **Update .env**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/waste-management?retryWrites=true&w=majority
   ```

## Environment Variables for Production

### Required Variables

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

### Optional Variables

```env
ENABLE_SWAGGER=true
ENABLE_LOGGER_UI=true
ENABLE_CORS=true
CORS_ORIGINS=https://your-frontend.com,https://your-app.com
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

## Digital Ocean Deployment

### App Platform (Easiest)

1. **Prepare Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO
   git push -u origin main
   ```

2. **Create App**
   - Go to Digital Ocean dashboard
   - Apps → Create App
   - Connect GitHub repository
   - Select branch (main)

3. **Configure Build**
   - Build Command: `npm install`
   - Run Command: `npm start`

4. **Add Environment Variables**
   - Add all variables from `.env`
   - Don't forget MongoDB connection string!

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - App will be available at provided URL

### Droplet (More Control)

1. **Create Droplet**
   - Ubuntu 22.04 LTS
   - Basic plan ($6/month minimum recommended)
   - Choose datacenter region

2. **SSH into Droplet**
   ```bash
   ssh root@your_droplet_ip
   ```

3. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Install PM2 (Process Manager)**
   ```bash
   sudo npm install -g pm2
   ```

5. **Clone Repository**
   ```bash
   git clone YOUR_REPO_URL
   cd waste-management-backend
   ```

6. **Install Dependencies**
   ```bash
   npm install --production
   ```

7. **Create .env File**
   ```bash
   nano .env
   # Paste your environment variables
   # Save: Ctrl+X, then Y, then Enter
   ```

8. **Start with PM2**
   ```bash
   pm2 start server.js --name waste-api
   pm2 startup
   pm2 save
   ```

9. **Configure Firewall**
   ```bash
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw allow 5000  # API (or use reverse proxy)
   sudo ufw enable
   ```

10. **Optional: Setup Nginx Reverse Proxy**
    ```bash
    sudo apt install nginx
    sudo nano /etc/nginx/sites-available/waste-api
    ```

    Add configuration:
    ```nginx
    server {
        listen 80;
        server_name your_domain.com;

        location / {
            proxy_pass http://localhost:5000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

    Enable site:
    ```bash
    sudo ln -s /etc/nginx/sites-available/waste-api /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

## Docker Deployment

### Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

### Create docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
      - MONGODB_URI=${MONGODB_URI}
      - ENABLE_SWAGGER=true
      - ENABLE_LOGGER_UI=true
      - CORS_ORIGINS=${CORS_ORIGINS}
    restart: unless-stopped
```

### Build and Run

```bash
docker-compose up -d
```

## Post-Deployment Checklist

- [ ] MongoDB is accessible (test connection)
- [ ] All environment variables are set
- [ ] CORS origins include your frontend URL
- [ ] API is accessible at `/health`
- [ ] Swagger docs work at `/api-docs`
- [ ] Seed database if needed: `npm run seed`
- [ ] Test key endpoints
- [ ] Monitor logs for errors
- [ ] Set up monitoring/alerts

## Monitoring

### Check Server Status

```bash
# If using PM2
pm2 status
pm2 logs waste-api
pm2 monit
```

### View Logs

```bash
# PM2
pm2 logs waste-api --lines 100

# Or use the built-in logger UI
# http://your-server:5000/logs
```

### Restart Server

```bash
# PM2
pm2 restart waste-api

# Or
pm2 reload waste-api  # Zero-downtime restart
```

## Troubleshooting

### Server Won't Start

1. Check MongoDB connection
   ```bash
   mongosh "YOUR_CONNECTION_STRING"
   ```

2. Check environment variables
   ```bash
   pm2 env 0  # Show environment for process 0
   ```

3. Check logs
   ```bash
   pm2 logs waste-api --lines 50
   ```

### High Memory Usage

```bash
# Restart API
pm2 restart waste-api

# Or reload (zero-downtime)
pm2 reload waste-api
```

### Database Connection Issues

1. Verify MongoDB is running
2. Check connection string format
3. For Atlas: verify IP whitelist
4. Check network firewall rules

### CORS Errors

Update CORS_ORIGINS in .env:
```env
CORS_ORIGINS=https://frontend.com,https://app.com
```

Then restart:
```bash
pm2 restart waste-api
```

## Security Best Practices

1. **Never commit .env file**
   - Already in .gitignore
   - Use environment variables in deployment

2. **Use MongoDB Atlas**
   - Better security than exposed MongoDB port
   - Automatic backups
   - Built-in monitoring

3. **Enable HTTPS**
   - Use Let's Encrypt with Certbot
   - Configure Nginx reverse proxy

4. **Keep packages updated**
   ```bash
   npm audit
   npm audit fix
   ```

5. **Use PM2 watch mode**
   ```bash
   pm2 start server.js --watch --ignore-watch="node_modules logs"
   ```

## Performance Optimization

1. **Enable compression**
   - Already included in Express setup

2. **Use PM2 cluster mode**
   ```bash
   pm2 start server.js -i max
   ```

3. **MongoDB indexes**
   - Already configured in models
   - Monitor slow queries

4. **Cache frequently accessed data**
   - Consider Redis for caching (future enhancement)

## Backup Strategy

### MongoDB Atlas (Automatic)
- Continuous backups enabled by default
- Point-in-time recovery
- Download backups from dashboard

### Manual Backup

```bash
# Export database
mongodump --uri="YOUR_CONNECTION_STRING" --out=./backup

# Restore database
mongorestore --uri="YOUR_CONNECTION_STRING" ./backup
```

---

**Need Help?** Check the main README.md or QUICK_START.md for more information.

