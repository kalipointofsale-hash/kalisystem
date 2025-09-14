import React, { useEffect, useState } from 'react';
import { useTelegram } from './TelegramProvider';
import { User, Smartphone, Zap, Heart, Wifi, BarChart3 } from 'lucide-react';
import { Dashboard } from './Dashboard';

export const WelcomeScreen: React.FC = () => {
  const { user, hapticFeedback, showMainButton, hideMainButton, showAlert, webApp, sendData } = useTelegram();
  const [currentView, setCurrentView] = useState<'welcome' | 'profile' | 'features' | 'dashboard'>('welcome');

  useEffect(() => {
    showMainButton('Get Started', () => {
      hapticFeedback.medium();
      setCurrentView('profile');
    });

    return () => hideMainButton();
  }, []);

  useEffect(() => {
    if (currentView === 'profile') {
      showMainButton('Explore Features', () => {
        hapticFeedback.medium();
        setCurrentView('features');
      });
    } else if (currentView === 'features') {
      showMainButton('Show Info', async () => {
        hapticFeedback.light();
        await showAlert('This is a demo Telegram Mini App built with React and TypeScript!');
      });
    } else if (currentView === 'dashboard') {
      showMainButton('Back to Features', () => {
        hapticFeedback.medium();
        setCurrentView('features');
      });
    }
  }, [currentView]);

  const handleFeatureClick = (feature: string) => {
    hapticFeedback.selection();
    
    if (feature === 'Dashboard') {
      setCurrentView('dashboard');
    } else if (feature === 'Ping Bot') {
      handlePingBot();
    } else {
      showAlert(`${feature} feature clicked!`);
    }
  };

  const handlePingBot = async () => {
    try {
      hapticFeedback.medium();
      
      try {
        // Method 1: Try API call first
        const response = await fetch('/api/bot/ping', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user?.id,
            action: 'api_ping',
            message: 'Testing API connection from Mini App'
          })
        });
        
        if (response.ok) {
          await showAlert('🏓 API Ping sent to bot! Check your chat for the response.');
          hapticFeedback.success();
          return;
        }
        
        throw new Error('API ping failed, trying web_app_data method');
        
      } catch (apiError) {
        console.log('API method failed, trying web_app_data method:', apiError);
        
        // Method 2: Fallback to web_app_data
        const pingData = {
          type: 'ping',
          action: 'ping_test',
          message: 'Testing connection from Mini App',
          userName: user?.first_name,
          timestamp: new Date().toISOString()
        };
        
        sendData(pingData);
        
        await showAlert('🏓 Ping sent to bot! Check your chat for the response.');
        hapticFeedback.success();
      }
      
    } catch (error) {
      console.error('Error sending ping:', error);
      await showAlert('❌ Failed to send ping. Please try again.');
      hapticFeedback.error();
    }
  };

  if (currentView === 'dashboard') {
    return <Dashboard />;
  }

  if (currentView === 'welcome') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--tg-bg-color,#ffffff)]">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Zap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--tg-text-color,#000000)] mb-4">
            Welcome to TMA
          </h1>
          <p className="text-[var(--tg-hint-color,#999999)] text-lg leading-relaxed">
            Experience the power of Telegram Mini Apps with modern React development
          </p>
        </div>
      </div>
    );
  }

  if (currentView === 'profile') {
    return (
      <div className="min-h-screen p-6 bg-[var(--tg-bg-color,#ffffff)]">
        <div className="max-w-sm mx-auto pt-12">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--tg-text-color,#000000)] mb-2">
              Hello, {user?.first_name || 'User'}!
            </h2>
            <p className="text-[var(--tg-hint-color,#999999)]">
              Welcome to your personalized experience
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-[var(--tg-secondary-bg-color,#f8f9fa)] rounded-2xl p-4">
              <h3 className="font-semibold text-[var(--tg-text-color,#000000)] mb-2">Profile Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--tg-hint-color,#999999)]">Name:</span>
                  <span className="text-[var(--tg-text-color,#000000)]">
                    {user?.first_name} {user?.last_name}
                  </span>
                </div>
                {user?.username && (
                  <div className="flex justify-between">
                    <span className="text-[var(--tg-hint-color,#999999)]">Username:</span>
                    <span className="text-[var(--tg-text-color,#000000)]">@{user.username}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[var(--tg-hint-color,#999999)]">Language:</span>
                  <span className="text-[var(--tg-text-color,#000000)]">
                    {user?.language_code || 'en'}
                  </span>
                </div>
                {user?.is_premium && (
                  <div className="flex justify-between">
                    <span className="text-[var(--tg-hint-color,#999999)]">Status:</span>
                    <span className="text-[var(--tg-link-color,#0088cc)] font-medium">Premium ⭐</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[var(--tg-secondary-bg-color,#f8f9fa)] rounded-2xl p-4">
              <h3 className="font-semibold text-[var(--tg-text-color,#000000)] mb-2">App Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--tg-hint-color,#999999)]">Version:</span>
                  <span className="text-[var(--tg-text-color,#000000)]">{webApp?.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--tg-hint-color,#999999)]">Platform:</span>
                  <span className="text-[var(--tg-text-color,#000000)]">{webApp?.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--tg-hint-color,#999999)]">Theme:</span>
                  <span className="text-[var(--tg-text-color,#000000)]">{webApp?.colorScheme}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-[var(--tg-bg-color,#ffffff)]">
      <div className="max-w-sm mx-auto pt-8">
        <h2 className="text-2xl font-bold text-[var(--tg-text-color,#000000)] mb-6 text-center">
          App Features
        </h2>

        <div className="space-y-4">
          <div 
            onClick={() => handleFeatureClick('Dashboard')}
            className="bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl p-4 active:scale-95 transition-transform cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Environment Dashboard</h3>
                <p className="text-white/80 text-sm">
                  View metrics and connection quality
                </p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => handleFeatureClick('Ping Bot')}
            className="bg-gradient-to-r from-green-400 to-blue-500 rounded-2xl p-4 active:scale-95 transition-transform cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Wifi className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Ping Bot</h3>
                <p className="text-white/80 text-sm">
                  Test connection with Telegram bot
                </p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => handleFeatureClick('Haptic Feedback')}
            className="bg-[var(--tg-secondary-bg-color,#f8f9fa)] rounded-2xl p-4 active:scale-95 transition-transform cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--tg-text-color,#000000)]">Haptic Feedback</h3>
                <p className="text-[var(--tg-hint-color,#999999)] text-sm">
                  Feel the vibration when you interact
                </p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => handleFeatureClick('Native UI')}
            className="bg-[var(--tg-secondary-bg-color,#f8f9fa)] rounded-2xl p-4 active:scale-95 transition-transform cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--tg-text-color,#000000)]">Native UI</h3>
                <p className="text-[var(--tg-hint-color,#999999)] text-sm">
                  Telegram-native interface components
                </p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => handleFeatureClick('Theme Integration')}
            className="bg-[var(--tg-secondary-bg-color,#f8f9fa)] rounded-2xl p-4 active:scale-95 transition-transform cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--tg-text-color,#000000)]">Theme Integration</h3>
                <p className="text-[var(--tg-hint-color,#999999)] text-sm">
                  Follows your Telegram theme automatically
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gradient-to-r from-[var(--tg-button-color,#0088cc)] to-blue-600 rounded-2xl text-center">
          <h3 className="text-white font-semibold mb-1">Bot Integration Ready!</h3>
          <p className="text-white/80 text-sm">
            Click "Ping Bot" to test the connection
          </p>
        </div>
      </div>
    </div>
  );
};