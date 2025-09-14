# Telegram Mini App Bot

This is a Telegram bot that integrates with the Mini App to provide seamless communication between the web app and Telegram chat.

## Features

- 🤖 Full Telegram Bot API integration
- 📱 Mini App web_app_data handling
- 🏓 Ping/Pong functionality
- 🔄 Real-time communication
- 📊 User session management
- 🌐 REST API endpoints
- ✅ Error handling and logging

## Setup Instructions

### 1. Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow the instructions to create your bot
4. Copy the bot token

### 2. Configure the Bot

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` file:
   ```env
   BOT_TOKEN=your_actual_bot_token_here
   WEBAPP_URL=https://your-deployed-mini-app-url.com
   PORT=3001
   ```

### 3. Install Dependencies

```bash
cd bot
npm install
```

### 4. Run the Bot

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

## Bot Commands

- `/start` - Initialize the bot and show Mini App button
- Inline buttons for Mini App access and information

## API Endpoints

- `POST /api/bot/ping` - Send ping message to user's chat
- `GET /api/user/:userId` - Get user information
- `GET /health` - Health check endpoint

## Mini App Integration

The bot handles several types of data from the Mini App:

### Web App Data Types

1. **Ping Request**
   ```json
   {
     "type": "ping",
     "action": "ping_test",
     "message": "Testing connection"
   }
   ```

2. **User Action**
   ```json
   {
     "type": "user_action",
     "action": "button_click",
     "details": "Feature button clicked"
   }
   ```

3. **Feature Click**
   ```json
   {
     "type": "feature_click",
     "feature": "haptic_feedback",
     "userName": "John Doe"
   }
   ```

## Deployment

### Using Node.js Server

1. Deploy the bot code to your server
2. Set environment variables
3. Run with PM2 or similar process manager:
   ```bash
   pm2 start index.js --name telegram-bot
   ```

### Using Docker

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t telegram-mini-app-bot .
docker run -p 3001:3001 --env-file .env telegram-mini-app-bot
```

## Security Notes

- Never commit your `.env` file
- Use HTTPS for webhook URLs in production
- Validate all incoming data
- Implement rate limiting for API endpoints
- Use proper error handling

## Troubleshooting

1. **Bot not responding**: Check if BOT_TOKEN is correct
2. **Mini App not opening**: Verify WEBAPP_URL is accessible
3. **API errors**: Check server logs and network connectivity
4. **Session issues**: Restart the bot to clear user sessions

## Development Tips

- Use `nodemon` for development (included in dev dependencies)
- Check bot logs for debugging information
- Test with multiple users to verify session handling
- Use Telegram's test environment for development