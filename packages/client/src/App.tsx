// ============================================================
// App.tsx — 화면 라우터 (Zustand screen 상태에 따라 전환)
// ============================================================
import React from 'react';
import { useGameStore } from './store/useGameStore';
import { Home } from './components/Home/Home';
import { Lobby } from './components/Lobby/Lobby';
import { WaitingRoom } from './components/WaitingRoom/WaitingRoom';
import { GameView } from './components/Game/GameView';
import './index.css';

const App: React.FC = () => {
  const screen = useGameStore(s => s.screen);

  switch (screen) {
    case 'home':    return <Home />;
    case 'lobby':   return <Lobby />;
    case 'waiting': return <WaitingRoom />;
    case 'game':    return <GameView />;
    default:        return <Home />;
  }
};

export default App;
