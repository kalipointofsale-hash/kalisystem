import { useEffect, useState } from 'react';
import { TelegramWebApp, TelegramUser } from '../types/telegram';

export const useTelegramWebApp = () => {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-web-app.js';
    script.async = true;

    script.onload = () => {
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        setWebApp(tg);
        setUser(tg.initDataUnsafe.user || null);
        
        // Initialize the app
        tg.ready();
        tg.expand();
        
        // Set theme colors
        document.documentElement.style.setProperty('--tg-bg-color', tg.backgroundColor);
        document.documentElement.style.setProperty('--tg-text-color', tg.themeParams.text_color || '#000');
        document.documentElement.style.setProperty('--tg-hint-color', tg.themeParams.hint_color || '#999');
        document.documentElement.style.setProperty('--tg-link-color', tg.themeParams.link_color || '#0088cc');
        document.documentElement.style.setProperty('--tg-button-color', tg.themeParams.button_color || '#0088cc');
        document.documentElement.style.setProperty('--tg-button-text-color', tg.themeParams.button_text_color || '#fff');
        
        setIsLoading(false);
      }
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const hapticFeedback = {
    light: () => webApp?.HapticFeedback.impactOccurred('light'),
    medium: () => webApp?.HapticFeedback.impactOccurred('medium'),
    heavy: () => webApp?.HapticFeedback.impactOccurred('heavy'),
    success: () => webApp?.HapticFeedback.notificationOccurred('success'),
    error: () => webApp?.HapticFeedback.notificationOccurred('error'),
    warning: () => webApp?.HapticFeedback.notificationOccurred('warning'),
    selection: () => webApp?.HapticFeedback.selectionChanged(),
  };

  const showMainButton = (text: string, onClick: () => void) => {
    if (webApp?.MainButton) {
      webApp.MainButton.setText(text);
      webApp.MainButton.onClick(onClick);
      webApp.MainButton.show();
    }
  };

  const hideMainButton = () => {
    webApp?.MainButton.hide();
  };

  const showBackButton = (onClick: () => void) => {
    if (webApp?.BackButton) {
      webApp.BackButton.onClick(onClick);
      webApp.BackButton.show();
    }
  };

  const hideBackButton = () => {
    webApp?.BackButton.hide();
  };

  const showPopup = (title: string, message: string, buttons?: Array<{ text: string; type?: string }>) => {
    return new Promise<string>((resolve) => {
      webApp?.showPopup(
        {
          title,
          message,
          buttons: buttons?.map((btn, index) => ({
            id: index.toString(),
            text: btn.text,
            type: btn.type as any || 'default'
          }))
        },
        (buttonId) => resolve(buttonId)
      );
    });
  };

  const showAlert = (message: string) => {
    return new Promise<void>((resolve) => {
      webApp?.showAlert(message, () => resolve());
    });
  };

  const showConfirm = (message: string) => {
    return new Promise<boolean>((resolve) => {
      webApp?.showConfirm(message, (confirmed) => resolve(confirmed));
    });
  };

  const openLink = (url: string, tryInstantView = false) => {
    webApp?.openLink(url, { try_instant_view: tryInstantView });
  };

  const sendData = (data: any) => {
    webApp?.sendData(typeof data === 'string' ? data : JSON.stringify(data));
  };

  const close = () => {
    webApp?.close();
  };

  return {
    webApp,
    user,
    isLoading,
    hapticFeedback,
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
    showPopup,
    showAlert,
    showConfirm,
    openLink,
    sendData,
    close,
    isReady: !isLoading && !!webApp
  };
};