import { useEffect, useState } from 'react';
import { isMobileDevice } from './lib/isMobile';
import { parseHash } from './lib/routing';
import LandingPage from './components/LandingPage/LandingPage';
import TakeawaysPage from './components/Takeaways/TakeawaysPage';
import StrategiesPage from './components/Strategies/StrategiesPage';
import OpponentsPage from './components/Opponents/OpponentsPage';
import Player from './components/Player/Player';

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

  if (route.view === 'game') {
    return <Player key={route.gameId} gameId={route.gameId} isMobile={isMobile} />;
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

  return <LandingPage isMobile={isMobile} />;
}
