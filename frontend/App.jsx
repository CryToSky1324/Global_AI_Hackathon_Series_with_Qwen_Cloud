import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import Dashboard from './src/pages/Dashboard';
import LandingPage from './src/pages/LandingPage';
import BlueprintPage from './src/pages/BlueprintPage';

function getInitialTheme() {
  const savedTheme = window.localStorage.getItem('genesis-theme');
  if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const path = window.location.pathname;
  const blueprintMatch = path.match(/^\/chat\/([^/]+)\/blueprint\/?$/);
  const chatMatch = path.match(/^\/chat\/([^/]+)\/?$/);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem('genesis-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  const floatingThemeToggle = (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
    >
      {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
      <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  );

  if (blueprintMatch) {
    return (
      <BlueprintPage chatId={decodeURIComponent(blueprintMatch[1])} theme={theme} onToggleTheme={toggleTheme} />
    );
  }

  if (path === '/chat') {
    return (
      <Dashboard theme={theme} onToggleTheme={toggleTheme} />
    );
  }

  if (chatMatch) {
    return (
      <Dashboard initialChatId={decodeURIComponent(chatMatch[1])} theme={theme} onToggleTheme={toggleTheme} />
    );
  }

  return (
    <>
      <LandingPage />
      {floatingThemeToggle}
    </>
  );
}
