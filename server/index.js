const express = require('express');
const path = require('path');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

// Bot configuration
const BOT_TOKEN = process.env.BOT_TOKEN || '8351526867:AAEjsG7vOSQ9AgitjALyN9BEh6qyPQk131c';
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://your-domain.com';

// Create bot instance
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Store user sessions
const userSessions = new Map();

// Bot commands
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  userSessions.set(userId, {
    chatId,
    username: msg.from.username,
    firstName: msg.from.first_name,
    lastName: msg.from.last_name
  });

  const welcomeMessage = `🚀 Welcome to TMA Demo Bot!

This bot demonstrates Telegram Mini App integration.

Click the button below to open the Mini App:`;

  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🎯 Open Mini App',
            web_app: { url: WEBAPP_URL }
          }
        ],
        [
          {
            text: '📱 About Mini Apps',
            callback_data: 'about_mini_apps'
          }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, welcomeMessage, options);
});

// Handle callback queries
bot.on('callback_query', (callbackQuery) => {
  const message = callbackQuery.message;
  const data = callbackQuery.data;
  const chatId = message.chat.id;

  if (data === 'about_mini_apps') {
    const aboutMessage = `📱 About Telegram Mini Apps

Mini Apps are lightweight applications that run inside Telegram. They provide:

✅ Native Telegram integration
✅ Seamless user experience  
✅ Access to user data (with permission)
✅ Haptic feedback
✅ Theme integration
✅ Payment processing
✅ Cloud storage

Try our demo Mini App to see these features in action!`;

    bot.editMessageText(aboutMessage, {
      chat_id: chatId,
      message_id: message.message_id,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🎯 Open Mini App',
              web_app: { url: WEBAPP_URL }
            }
          ],
          [
            {
              text: '🔙 Back to Start',
              callback_data: 'back_to_start'
            }
          ]
        ]
      }
    });
  } else if (data === 'back_to_start') {
    const welcomeMessage = `🚀 Welcome to TMA Demo Bot!

This bot demonstrates Telegram Mini App integration.

Click the button below to open the Mini App:`;

    bot.editMessageText(welcomeMessage, {
      chat_id: chatId,
      message_id: message.message_id,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🎯 Open Mini App',
              web_app: { url: WEBAPP_URL }
            }
          ],
          [
            {
              text: '📱 About Mini Apps',
              callback_data: 'about_mini_apps'
            }
          ]
        ]
      }
    });
  }

  bot.answerCallbackQuery(callbackQuery.id);
});

// Handle web app data from mini app
bot.on('web_app_data', (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const data = JSON.parse(msg.web_app_data.data);

  console.log('Received web app data:', data);

  switch (data.type) {
    case 'ping':
      handlePingRequest(chatId, userId, data);
      break;
    case 'user_action':
      handleUserAction(chatId, userId, data);
      break;
    case 'feature_click':
      handleFeatureClick(chatId, userId, data);
      break;
    default:
      bot.sendMessage(chatId, `✅ Received data from Mini App: ${data.message || 'Unknown action'}`);
  }
});

// Handle ping requests
function handlePingRequest(chatId, userId, data) {
  const user = userSessions.get(userId);
  const userName = user?.firstName || 'User';
  
  const pingMessage = `🏓 Ping Success!

Hello ${userName}! Your Mini App is working perfectly.

📊 Request Details:
• Action: ${data.action || 'ping'}
• Timestamp: ${new Date().toLocaleString()}
• Status: ✅ Connected

The communication between your Mini App and this bot is working flawlessly!`;

  bot.sendMessage(chatId, pingMessage, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '🎯 Open Mini App Again',
            web_app: { url: WEBAPP_URL }
          }
        ]
      ]
    }
  });
}

// Handle user actions
function handleUserAction(chatId, userId, data) {
  const actionMessage = `🎯 Action Received!

Action: ${data.action}
Details: ${data.details || 'No additional details'}
Time: ${new Date().toLocaleString()}

Your Mini App interaction was processed successfully!`;

  bot.sendMessage(chatId, actionMessage);
}

// Handle feature clicks
function handleFeatureClick(chatId, userId, data) {
  const featureMessage = `⚡ Feature Interaction!

Feature: ${data.feature}
User: ${data.userName || 'Unknown'}
Action: ${data.action || 'click'}

Thanks for exploring the Mini App features!`;

  bot.sendMessage(chatId, featureMessage);
}

// API endpoint for ping (alternative method)
app.post('/api/bot/ping', (req, res) => {
  const { userId, action, message } = req.body;
  
  console.log('Received ping request:', { userId, action, message });
  
  if (!userId) {
    console.log('Missing userId in ping request');
    return res.status(400).json({ error: 'User ID is required' });
  }

  const user = userSessions.get(parseInt(userId));
  if (!user) {
    console.log('User session not found for userId:', userId);
    console.log('Available sessions:', Array.from(userSessions.keys()));
    return res.status(404).json({ error: 'User session not found' });
  }

  console.log('Found user session:', user);
  
  const pingMessage = `🏓 API Ping Success!

Hello ${user.firstName}! Your Mini App API call was successful.

📊 Request Details:
• Action: ${action || 'api_ping'}
• Message: ${message || 'No message'}
• Timestamp: ${new Date().toLocaleString()}
• Method: API Call
• Status: ✅ Connected`;

  bot.sendMessage(user.chatId, pingMessage);
  
  console.log('Ping message sent to chat:', user.chatId);
  
  res.json({ 
    success: true, 
    message: 'Ping sent successfully',
    timestamp: new Date().toISOString()
  });
});

// API endpoint to get user info
app.get('/api/user/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const user = userSessions.get(userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({
    userId,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    activeSessions: userSessions.size
  });
});

// Serve the Mini App
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handling
bot.on('error', (error) => {
  console.error('Bot error:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🤖 Bot is active and listening`);
  console.log(`📱 Mini App URL: ${WEBAPP_URL}`);
});

console.log('🤖 Telegram Bot and Server started successfully!');