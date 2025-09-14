# Telegram Mini App with Bot Integration

A complete Telegram Mini App implementation with integrated bot server following TMA best practices.

## Architecture

```
├── src/                 # React Mini App source
├── dist/               # Built Mini App (static files)
├── server/             # Express server + Telegram bot
└── bot/               # Legacy bot files (for reference)
```

## Requirements for Production

### 1. HTTPS Domain Required
Telegram Mini Apps **MUST** be served over HTTPS. Local development won't work for actual Telegram integration.

### 2. Server Setup
The bot needs to run on a server that can:
- Serve the Mini App static files
- Handle Telegram bot API calls
- Process webhooks and web_app_data

### 3. Proper Configuration
- Bot token from @BotFather
- Real domain (not localhost)
- Server environment variables

## Setup Instructions

### 1. Development Setup
```bash
# Install dependencies
npm install
cd server && npm install

# Build the Mini App
npm run build

# Start the server (serves Mini App + runs bot)
npm run start:server
```

### 2. Production Deployment

#### Option A: Deploy to Cloud Platform (Recommended)
1. Deploy to platforms like:
   - Railway
   - Render
   - Heroku
   - DigitalOcean App Platform
   - AWS/GCP/Azure

2. Set environment variables:
   ```
   BOT_TOKEN=8351526867:AAEjsG7vOSQ9AgitjALyN9BEh6qyPQk131c
   WEBAPP_URL=https://your-deployed-domain.com
   PORT=3000
   ```

3. Configure your bot with @BotFather:
   - Set the Mini App URL to your deployed domain
   - Configure bot commands and description

#### Option B: VPS/Server Setup
1. Upload code to your server
2. Install Node.js and dependencies
3. Configure environment variables
4. Set up reverse proxy (nginx) with SSL
5. Use PM2 or similar for process management

### 3. Bot Configuration with @BotFather

1. Message @BotFather on Telegram
2. Use `/setmenubutton` command
3. Select your bot
4. Set the Mini App URL to your deployed domain

## Testing the Integration

1. **Find your bot** on Telegram
2. **Send `/start`** - should show Mini App button
3. **Click "Open Mini App"** - should load your app over HTTPS
4. **Navigate to Features** and click "Ping Bot"
5. **Receive success message** in bot chat

## Common Issues

### ❌ "Mini App not loading"
- Check if URL is HTTPS
- Verify domain is accessible
- Check server logs

### ❌ "Ping not working"
- Ensure bot is running
- Check bot token is correct
- Verify web_app_data handling

### ❌ "Theme not working"
- Check Telegram Web App script loading
- Verify CSS variables are set
- Test in actual Telegram (not browser)

## File Structure

```
server/index.js         # Main server + bot logic
server/package.json     # Server dependencies
src/                   # Mini App React code
dist/                  # Built Mini App files
```

## API Endpoints

- `GET /` - Serves Mini App
- `POST /api/bot/ping` - Alternative ping endpoint
- `GET /api/user/:userId` - Get user info
- `GET /health` - Health check

## Security Notes

- Never expose bot token in client code
- Use HTTPS in production
- Validate all incoming data
- Implement rate limiting for APIs

## Next Steps

1. **Deploy to a cloud platform**
2. **Configure your domain with @BotFather**
3. **Test with real Telegram users**
4. **Add more Mini App features**