/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KanbanBoard } from './components/KanbanBoard';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { AppBackdrop } from './components/AppBackdrop';

const queryClient = new QueryClient();

type ActiveView = 'board' | 'assistant';
export type ThemeMode = 'aurora' | 'daybreak';

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'aurora';
  const storedTheme = window.localStorage.getItem('taskflow-theme');
  return storedTheme === 'daybreak' ? 'daybreak' : 'aurora';
};

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('board');
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme);

  React.useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    window.localStorage.setItem('taskflow-theme', themeMode);
  }, [themeMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-shell relative h-screen w-full overflow-hidden font-sans text-white">
        <AppBackdrop />
        <div className="relative z-10 h-full w-full">
          {activeView === 'board' ? (
            <div className="flex h-full w-full overflow-hidden">
              <KanbanBoard
                onOpenAssistant={() => setActiveView('assistant')}
                themeMode={themeMode}
                onToggleTheme={() =>
                  setThemeMode((currentTheme) => (currentTheme === 'aurora' ? 'daybreak' : 'aurora'))
                }
              />
            </div>
          ) : (
            <div className="flex h-full w-full overflow-hidden">
              <Sidebar />
              <ChatWindow
                onBack={() => setActiveView('board')}
                themeMode={themeMode}
                onToggleTheme={() =>
                  setThemeMode((currentTheme) => (currentTheme === 'aurora' ? 'daybreak' : 'aurora'))
                }
              />
            </div>
          )}
        </div>
      </div>
    </QueryClientProvider>
  );
}
