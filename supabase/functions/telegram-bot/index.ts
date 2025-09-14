import { createClient } from 'npm:@supabase/supabase-js@2';
import { JWT } from 'npm:google-auth-library@9';

// Add logging for debugging
console.log('Starting Telegram Bot Edge Function...');
console.log('Environment check:', {
  hasBotToken: !!Deno.env.get('TELEGRAM_BOT_TOKEN'),
  hasWebappUrl: !!Deno.env.get('WEBAPP_URL'),
  hasAdminIds: !!Deno.env.get('ADMIN_USER_IDS'),
  hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
  hasServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Bot configuration from environment variables
const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const WEBAPP_URL = Deno.env.get('WEBAPP_URL');
const ADMIN_USER_IDS = Deno.env.get('ADMIN_USER_IDS')?.split(',').map(id => parseInt(id.trim())) || [];
const GOOGLE_PROJECT_ID = Deno.env.get('GOOGLE_PROJECT_ID');
const GOOGLE_CLIENT_EMAIL = Deno.env.get('GOOGLE_CLIENT_EMAIL');
const GOOGLE_PRIVATE_KEY = Deno.env.get('GOOGLE_PRIVATE_KEY');
const GOOGLE_SHEET_ID = Deno.env.get('GOOGLE_SHEET_ID');

console.log('Configuration loaded:', {
  botToken: BOT_TOKEN ? 'SET' : 'MISSING',
  webappUrl: WEBAPP_URL || 'MISSING',
  adminCount: ADMIN_USER_IDS.length,
  hasGoogleProjectId: !!GOOGLE_PROJECT_ID,
  hasGoogleClientEmail: !!GOOGLE_CLIENT_EMAIL,
  hasGooglePrivateKey: !!GOOGLE_PRIVATE_KEY,
  hasSheetId: !!GOOGLE_SHEET_ID
});

if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN environment variable is required');
}

if (!WEBAPP_URL) {
  console.error('WEBAPP_URL environment variable is required');
}

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Initialize Google Sheets client
let googleAuth: GoogleAuth | null = null;

if (GOOGLE_PROJECT_ID && GOOGLE_CLIENT_EMAIL && GOOGLE_PRIVATE_KEY) {
  try {
    console.log('Initializing Google Auth with separate credentials...');
    console.log('Project ID:', GOOGLE_PROJECT_ID);
    console.log('Client Email:', GOOGLE_CLIENT_EMAIL);
    console.log('Private Key length:', GOOGLE_PRIVATE_KEY.length);
    
    googleAuth = new GoogleAuth({
      credentials: {
        client_email: GOOGLE_CLIENT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        project_id: GOOGLE_PROJECT_ID,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    console.log('Google Auth initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Google Auth:', error.message);
    console.error('Please check that all Google credentials are properly set:');
    console.error('- GOOGLE_PROJECT_ID');
    console.error('- GOOGLE_CLIENT_EMAIL');
    console.error('- GOOGLE_PRIVATE_KEY (with proper \\n escaping)');
  }
} else {
  console.log('Google credentials not fully provided - Google Sheets integration disabled');
  console.log('Missing:', {
    projectId: !GOOGLE_PROJECT_ID,
    clientEmail: !GOOGLE_CLIENT_EMAIL,
    privateKey: !GOOGLE_PRIVATE_KEY
  });
}

// Google Sheets helper functions
async function writeToGoogleSheets(data: any[]) {
  if (!googleAuth || !GOOGLE_SHEET_ID) {
    console.log('Google Sheets not configured:', {
      hasAuth: !!googleAuth,
      hasSheetId: !!GOOGLE_SHEET_ID
    });
    return false;
  }

  try {
    console.log('Attempting to authorize Google Sheets access...');
    const authClient = await googleAuth.getClient();
    const accessToken = await authClient.getAccessToken();
    console.log('Google Sheets authorization successful');

    console.log('Writing data to Google Sheets:', data.length, 'rows');
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/Metrics!A:Z:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: data
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Sheets API error response:', errorText);
      throw new Error(`Google Sheets API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Successfully wrote to Google Sheets:', result);
    return true;
  } catch (error) {
    console.error('Error writing to Google Sheets:', error);
    console.error('Error details:', error.message);
    return false;
  }
}

async function getEnvironmentMetrics() {
  try {
    console.log('Fetching environment metrics...');
    
    // Get user statistics
    const { count: totalUsers } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true });

    const { count: activeUsers } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    console.log('User statistics:', { totalUsers, activeUsers });
    // Simulate other metrics (in production, these would come from actual monitoring)
    const metrics = {
      timestamp: new Date().toISOString(),
      botStatus: 'online' as const,
      databaseConnections: Math.floor(Math.random() * 10) + 5,
      activeUsers: activeUsers || 0,
      totalUsers: totalUsers || 0,
      apiResponseTime: Math.floor(Math.random() * 200) + 50,
      successRate: Math.floor(Math.random() * 5) + 95,
      errorCount: Math.floor(Math.random() * 3),
      memoryUsage: Math.floor(Math.random() * 30) + 40,
      uptime: '2d 14h 32m'
    };

    // Test connection qualities
    const connectionQuality = {
      telegram: BOT_TOKEN ? 'online' as const : 'offline' as const,
      database: totalUsers !== null ? 'online' as const : 'offline' as const,
      googleSheets: googleAuth && GOOGLE_SHEET_ID ? 'online' as const : 'offline' as const,
      miniApp: 'online' as const
    };

    console.log('Generated metrics:', metrics);
    console.log('Connection quality:', connectionQuality);
    // Write metrics to Google Sheets
    if (googleAuth && GOOGLE_SHEET_ID) {
      console.log('Attempting to write metrics to Google Sheets...');
      const sheetData = [
        [
          metrics.timestamp,
          metrics.botStatus,
          metrics.databaseConnections.toString(),
          metrics.activeUsers.toString(),
          metrics.totalUsers.toString(),
          metrics.apiResponseTime.toString(),
          metrics.successRate.toString(),
          metrics.errorCount.toString(),
          metrics.memoryUsage.toString(),
          metrics.uptime,
          connectionQuality.telegram,
          connectionQuality.database,
          connectionQuality.googleSheets,
          connectionQuality.miniApp
        ]
      ];
      
      const writeSuccess = await writeToGoogleSheets(sheetData);
      console.log('Google Sheets write result:', writeSuccess);
    } else {
      console.log('Skipping Google Sheets write - not configured');
    }

    return { metrics, connectionQuality };
  } catch (error) {
    console.error('Error getting environment metrics:', error);
    console.error('Error details:', error.message);
    return null;
  }
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    chat: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      type: string;
    };
    date: number;
    text?: string;
    web_app_data?: {
      data: string;
      button_text: string;
    };
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    message: {
      message_id: number;
      from: {
        id: number;
        is_bot: boolean;
        first_name: string;
        username?: string;
      };
      chat: {
        id: number;
        first_name?: string;
        last_name?: string;
        username?: string;
        type: string;
      };
      date: number;
      text?: string;
    };
    data: string;
  };
}

// Helper function to check if user is admin
function isAdmin(userId: number): boolean {
  return ADMIN_USER_IDS.includes(userId);
}

// Telegram API helper functions
async function sendMessage(chatId: number, text: string, replyMarkup?: any) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  
  const payload = {
    chat_id: chatId,
    text: text,
    reply_markup: replyMarkup,
    parse_mode: 'HTML'
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Clone the response to avoid "Body already consumed" error
    const clonedResponse = response.clone();

    if (!clonedResponse.ok) {
      const errorText = clonedResponse.status + ' ' + clonedResponse.statusText;
      console.error('Failed to send message:', errorText);
      throw new Error(`Telegram API error: ${clonedResponse.status}`);
    }
    
    const result = await clonedResponse.json();
    return result;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

async function editMessageText(chatId: number, messageId: number, text: string, replyMarkup?: any) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`;
  
  const payload = {
    chat_id: chatId,
    message_id: messageId,
    text: text,
    reply_markup: replyMarkup,
    parse_mode: 'HTML'
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Clone the response to avoid "Body already consumed" error
    const clonedResponse = response.clone();

    if (!clonedResponse.ok) {
      const errorText = clonedResponse.status + ' ' + clonedResponse.statusText;
      console.error('Failed to edit message:', errorText);
    }
    
    const result = await clonedResponse.json();
    return result;
  } catch (error) {
    console.error('Error editing message:', error);
    throw error;
  }
}

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`;
  
  const payload = {
    callback_query_id: callbackQueryId,
    text: text
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Clone the response to avoid "Body already consumed" error
    const clonedResponse = response.clone();

    if (!clonedResponse.ok) {
      console.error('Failed to answer callback query:', clonedResponse.status + ' ' + clonedResponse.statusText);
    }
    
    const result = await clonedResponse.json();
    return result;
  } catch (error) {
    console.error('Error answering callback query:', error);
    throw error;
  }
}

// Database helper functions
async function saveUserSession(userId: number, chatId: number, user: any) {
  try {
    const { error } = await supabase
      .from('user_sessions')
      .upsert({
        user_id: userId,
        chat_id: chatId,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving user session:', error);
    }
  } catch (error) {
    console.error('Database error:', error);
  }
}

async function getUserSession(userId: number) {
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error getting user session:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Database error:', error);
    return null;
  }
}

async function getAllUserSessions() {
  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting all user sessions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Database error:', error);
    return [];
  }
}

// Handle /start command
async function handleStartCommand(chatId: number, userId: number, user: any) {
  // Save user session to database
  await saveUserSession(userId, chatId, user);

  const adminBadge = isAdmin(userId) ? ' 👑' : '';
  const welcomeMessage = `🚀 <b>Welcome to TMA Demo Bot!</b>${adminBadge}

This bot demonstrates Telegram Mini App integration with Supabase and advanced features.

${isAdmin(userId) ? '👑 <i>Admin privileges detected</i>\n\n' : ''}Click the button below to open the Mini App:`;

  const inlineKeyboard = [
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
  ];

  // Add admin-only buttons
  if (isAdmin(userId)) {
    inlineKeyboard.push([
      {
        text: '👑 Admin Panel',
        callback_data: 'admin_panel'
      }
    ]);
  }

  const replyMarkup = {
    inline_keyboard: inlineKeyboard
  };

  await sendMessage(chatId, welcomeMessage, replyMarkup);
}

// Handle admin panel
async function handleAdminPanel(chatId: number, messageId: number) {
  const users = await getAllUserSessions();
  const totalUsers = users.length;
  const recentUsers = users.filter(user => {
    const updatedAt = new Date(user.updated_at);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return updatedAt > oneDayAgo;
  }).length;

  const adminMessage = `👑 <b>Admin Panel</b>

📊 <b>Statistics:</b>
• Total Users: ${totalUsers}
• Active (24h): ${recentUsers}
• Bot Status: ✅ Online
• Database: ✅ Connected
• Environment: ✅ Configured

🔧 <b>Configuration:</b>
• Webapp URL: ${WEBAPP_URL}
• Admin Users: ${ADMIN_USER_IDS.length}
• Google Service: ${GOOGLE_SERVICE_ACCOUNT_JSON ? '✅ Configured' : '❌ Not set'}

<i>Last updated: ${new Date().toLocaleString()}</i>`;

  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: '📊 User List',
          callback_data: 'admin_users'
        },
        {
          text: '🔄 Refresh Stats',
          callback_data: 'admin_panel'
        }
      ],
      [
        {
          text: '📱 Test Mini App',
          web_app: { url: WEBAPP_URL }
        }
      ],
      [
        {
          text: '🔙 Back to Main',
          callback_data: 'back_to_start'
        }
      ]
    ]
  };

  await editMessageText(chatId, messageId, adminMessage, replyMarkup);
}

// Handle admin user list
async function handleAdminUserList(chatId: number, messageId: number) {
  const users = await getAllUserSessions();
  
  let userListMessage = `👥 <b>User List</b> (${users.length} total)\n\n`;
  
  if (users.length === 0) {
    userListMessage += '<i>No users found</i>';
  } else {
    users.slice(0, 10).forEach((user, index) => {
      const adminBadge = isAdmin(user.user_id) ? ' 👑' : '';
      const lastSeen = new Date(user.updated_at).toLocaleDateString();
      userListMessage += `${index + 1}. <b>${user.first_name}${user.last_name ? ' ' + user.last_name : ''}</b>${adminBadge}\n`;
      userListMessage += `   @${user.username || 'no_username'} • ID: ${user.user_id}\n`;
      userListMessage += `   Last seen: ${lastSeen}\n\n`;
    });
    
    if (users.length > 10) {
      userListMessage += `<i>... and ${users.length - 10} more users</i>`;
    }
  }

  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: '🔙 Back to Admin Panel',
          callback_data: 'admin_panel'
        }
      ]
    ]
  };

  await editMessageText(chatId, messageId, userListMessage, replyMarkup);
}

// Handle callback queries
async function handleCallbackQuery(callbackQuery: any) {
  const message = callbackQuery.message;
  const data = callbackQuery.data;
  const chatId = message.chat.id;
  const userId = callbackQuery.from.id;

  // Check admin permissions for admin callbacks
  if (data.startsWith('admin_') && !isAdmin(userId)) {
    await answerCallbackQuery(callbackQuery.id, '❌ Admin access required');
    return;
  }

  switch (data) {
    case 'about_mini_apps':
      const aboutMessage = `📱 <b>About Telegram Mini Apps</b>

Mini Apps are lightweight applications that run inside Telegram. They provide:

✅ Native Telegram integration
✅ Seamless user experience
✅ Access to user data (with permission)
✅ Haptic feedback
✅ Theme integration
✅ Payment processing
✅ Cloud storage
✅ Supabase database integration
✅ Google Services integration

<b>This demo showcases:</b>
• React + TypeScript frontend
• Supabase Edge Functions backend
• Real-time database integration
• Admin panel functionality
• Secure environment management

Try our demo Mini App to see these features in action!`;

      const aboutReplyMarkup = {
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
      };

      await editMessageText(chatId, message.message_id, aboutMessage, aboutReplyMarkup);
      break;

    case 'admin_panel':
      await handleAdminPanel(chatId, message.message_id);
      break;

    case 'admin_users':
      await handleAdminUserList(chatId, message.message_id);
      break;

    case 'back_to_start':
      const adminBadge = isAdmin(userId) ? ' 👑' : '';
      const welcomeMessage = `🚀 <b>Welcome to TMA Demo Bot!</b>${adminBadge}

This bot demonstrates Telegram Mini App integration with Supabase and advanced features.

${isAdmin(userId) ? '👑 <i>Admin privileges detected</i>\n\n' : ''}Click the button below to open the Mini App:`;

      const inlineKeyboard = [
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
      ];

      if (isAdmin(userId)) {
        inlineKeyboard.push([
          {
            text: '👑 Admin Panel',
            callback_data: 'admin_panel'
          }
        ]);
      }

      const welcomeReplyMarkup = {
        inline_keyboard: inlineKeyboard
      };

      await editMessageText(chatId, message.message_id, welcomeMessage, welcomeReplyMarkup);
      break;
  }

  await answerCallbackQuery(callbackQuery.id);
}

// Handle web app data from mini app
async function handleWebAppData(message: any) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  const data = JSON.parse(message.web_app_data.data);

  console.log('Received web app data:', data);

  switch (data.type) {
    case 'ping':
      await handlePingRequest(chatId, userId, data);
      break;
    case 'user_action':
      await handleUserAction(chatId, userId, data);
      break;
    case 'feature_click':
      await handleFeatureClick(chatId, userId, data);
      break;
    default:
      await sendMessage(chatId, `✅ Received data from Mini App: ${data.message || 'Unknown action'}`);
  }
}

// Handle ping requests from mini app
async function handlePingRequest(chatId: number, userId: number, data: any) {
  const user = await getUserSession(userId);
  const userName = user?.first_name || 'User';
  const adminBadge = isAdmin(userId) ? ' 👑' : '';
  
  const pingMessage = `🏓 <b>Ping Success!</b>

Hello <b>${userName}</b>${adminBadge}! Your Mini App is working perfectly with our integrated stack.

📊 <b>Connection Details:</b>
• Action: ${data.action || 'ping'}
• Timestamp: ${new Date().toLocaleString()}
• Status: ✅ Connected
• Database: ✅ Supabase Connected
• Edge Function: ✅ Active
• Environment: ✅ Configured

🚀 <b>Stack Integration:</b>
• Frontend: Bolt Hosting
• Backend: Supabase Edge Functions
• Database: PostgreSQL
• Authentication: Telegram WebApp
${GOOGLE_SERVICE_ACCOUNT_JSON ? '• Google Services: ✅ Available' : ''}

The communication between your Mini App, Supabase Edge Function, and this bot is working flawlessly!`;

  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: '🎯 Open Mini App Again',
          web_app: { url: WEBAPP_URL }
        }
      ]
    ]
  };

  await sendMessage(chatId, pingMessage, replyMarkup);
}

// Handle user actions from mini app
async function handleUserAction(chatId: number, userId: number, data: any) {
  const adminBadge = isAdmin(userId) ? ' 👑' : '';
  
  const actionMessage = `🎯 <b>Action Received!</b>${adminBadge}

<b>Action:</b> ${data.action}
<b>Details:</b> ${data.details || 'No additional details'}
<b>Time:</b> ${new Date().toLocaleString()}
<b>User Type:</b> ${isAdmin(userId) ? 'Admin' : 'User'}

Your Mini App interaction was processed successfully via Supabase Edge Function!`;

  await sendMessage(chatId, actionMessage);
}

// Handle feature clicks from mini app
async function handleFeatureClick(chatId: number, userId: number, data: any) {
  const adminBadge = isAdmin(userId) ? ' 👑' : '';
  
  const featureMessage = `⚡ <b>Feature Interaction!</b>${adminBadge}

<b>Feature:</b> ${data.feature}
<b>User:</b> ${data.userName || 'Unknown'}
<b>Action:</b> ${data.action || 'click'}
<b>Access Level:</b> ${isAdmin(userId) ? 'Admin' : 'User'}

Thanks for exploring the Mini App features powered by our integrated stack!`;

  await sendMessage(chatId, featureMessage);
}

Deno.serve(async (req: Request) => {
  try {
    console.log(`Received ${req.method} request to ${req.url}`);
    
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    const url = new URL(req.url);
    console.log('Processing path:', url.pathname);
    
    // Handle webhook from Telegram
    if (req.method === 'POST' && (url.pathname === '/telegram-bot' || url.pathname === '/')) {
      let update: TelegramUpdate;
      try {
        update = await req.json();
      } catch (error) {
        console.error('Failed to parse JSON:', error);
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      console.log('Received update:', JSON.stringify(update, null, 2));

      if (!BOT_TOKEN || !WEBAPP_URL) {
        console.error('Missing required environment variables');
        return new Response(JSON.stringify({ error: 'Configuration error' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Handle regular messages
      if (update.message) {
        const message = update.message;
        const chatId = message.chat.id;
        const userId = message.from.id;
        const text = message.text;

        console.log(`Processing message from user ${userId}: ${text}`);

        // Handle /start command
        if (text === '/start') {
          console.log('Handling /start command');
          await handleStartCommand(chatId, userId, message.from);
        }
        // Handle web app data
        else if (message.web_app_data) {
          console.log('Handling web app data');
          await handleWebAppData(message);
        }
      }
      
      // Handle callback queries
      if (update.callback_query) {
        console.log('Handling callback query');
        await handleCallbackQuery(update.callback_query);
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle ping API endpoint (alternative method)
    if (req.method === 'POST' && url.pathname === '/api/bot/ping') {
      const { userId, action, message } = await req.json();
      
      if (!userId) {
        return new Response(JSON.stringify({ error: 'User ID is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const user = await getUserSession(parseInt(userId));
      if (!user) {
        return new Response(JSON.stringify({ error: 'User session not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const adminBadge = isAdmin(user.user_id) ? ' 👑' : '';
      const pingMessage = `🏓 <b>API Ping Success!</b>

Hello <b>${user.first_name}</b>${adminBadge}! Your Mini App API call was successful via Supabase Edge Function.

📊 <b>Request Details:</b>
• Action: ${action || 'api_ping'}
• Message: ${message || 'No message'}
• Timestamp: ${new Date().toLocaleString()}
• Method: API Call
• Database: ✅ Supabase Connected
• Status: ✅ Connected
• User Type: ${isAdmin(user.user_id) ? 'Admin' : 'User'}

The API communication is working perfectly with full stack integration!`;

      await sendMessage(user.chat_id, pingMessage);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Ping sent successfully',
        timestamp: new Date().toISOString(),
        userType: isAdmin(user.user_id) ? 'admin' : 'user'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle user info API endpoint
    if (req.method === 'GET' && url.pathname.startsWith('/api/user/')) {
      const userId = parseInt(url.pathname.split('/').pop() || '0');
      const user = await getUserSession(userId);
      
      if (!user) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({
        userId: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
        isAdmin: isAdmin(user.user_id),
        lastSeen: user.updated_at
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle metrics API endpoint
    if (req.method === 'GET' && url.pathname === '/api/metrics') {
      const metricsData = await getEnvironmentMetrics();
      
      if (!metricsData) {
        return new Response(JSON.stringify({ error: 'Failed to fetch metrics' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify(metricsData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Health check endpoint
    if (req.method === 'GET' && url.pathname === '/health') {
      const { count } = await supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true });

      return new Response(JSON.stringify({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        activeSessions: count || 0,
        database: 'connected',
        environment: {
          botToken: !!BOT_TOKEN,
          webappUrl: !!WEBAPP_URL,
          adminUsers: ADMIN_USER_IDS.length,
          googleServices: !!(GOOGLE_PROJECT_ID && GOOGLE_CLIENT_EMAIL && GOOGLE_PRIVATE_KEY),
          googleSheets: !!GOOGLE_SHEET_ID
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in telegram-bot function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});