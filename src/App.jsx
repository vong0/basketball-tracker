import { useEffect, useState } from 'react';
import { isMobileDevice } from './lib/isMobile';
import { parseHash } from './lib/routing';
import GamesPage from './pages/Games/GamesPage';
import GameDetailPage from './pages/Games/GameDetailPage.jsx';
import LandingPage from './pages/Landing/LandingPage';
import TakeawaysPage from './pages/Takeaways/TakeawaysPage';
import StrategiesPage from './pages/Strategies/StrategiesPage';
import OpponentsPage from './pages/Opponents/OpponentsPage';
import Player from './pages/Player/Player';
import PlayersPage from './pages/Players/PlayersPage.jsx';
import PlayerDetailPage from './pages/Players/PlayerDetailPage.jsx';
import TeamDetailPage from './pages/Players/TeamDetailPage.jsx';

export default function App() {
  const [route, setRoute] = useState(parseHash());
  const [isMobile, setIsMobile] = useState(isMobileDevice());

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(isMobileDevice());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (route.view === 'games') {
    return <GamesPage />;
  }

  if (route.view === 'gameDetail') {
    return <GameDetailPage gameId={route.gameId} />;
  }

  if (route.view === 'game') {
    return <Player key={route.gameId} gameId={route.gameId} isMobile={isMobile} />;
  }

  if (route.view === 'players') {
    return <PlayersPage />;
  }

  if (route.view === 'teamView') {
    return <TeamDetailPage />;
  }

  if (route.view === 'playerDetail') {
    return <PlayerDetailPage playerId={route.playerId} />;
  }

  if (route.view === 'takeaways') {
    return <TakeawaysPage isMobile={isMobile} />;
  }

  if (route.view === 'strategies') {
    return <StrategiesPage isMobile={isMobile} />;
  }

  if (route.view === 'opponents') {
    return <OpponentsPage isMobile={isMobile} />;
  }
  if (route.view === 'opponent') {
    return <OpponentsPage isMobile={isMobile} selectedId={route.teamId} />;
  }

  return <LandingPage isMobile={isMobile} />;
}
