import React from 'react';
import { TelegramProvider, useTelegram } from './components/TelegramProvider';
import { LoadingScreen } from './components/LoadingScreen';
import { WelcomeScreen } from './components/WelcomeScreen';

const AppContent: React.FC = () => {
  const { isLoading, isReady } = useTelegram();

  if (isLoading || !isReady) {
    return <LoadingScreen />;
  }

  return <WelcomeScreen />;
};

function App() {
  return (
    <TelegramProvider>
      <div className="min-h-screen bg-[var(--tg-bg-color,#ffffff)]">
        <AppContent />
      </div>
    </TelegramProvider>
  );
}

export default App;