import React from 'react';
import { useProgress } from '@react-three/drei';

export function LoadingScreen({ started }) {
  const { progress, active } = useProgress();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (active) setVisible(true);
    if (!active && progress >= 100) {
      const t = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(t);
    }
  }, [active, progress]);

  // Safety: never let loading screen stay for more than 8s
  React.useEffect(() => {
    const t = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(t);
  }, []);

  const loadingMessages = [
    'Blooming the flowers…',
    'Waking up the ducks…',
    'Warming the sunshine…',
    'Setting up the ferris wheel…',
    'Polishing the bowling pins…',
    'Baking cotton candy…',
    'Rehearsing the sunset…',
    'Tuning the guitars…',
  ];
  const msg = loadingMessages[Math.floor((progress / 100) * loadingMessages.length) % loadingMessages.length];

  return (
    <div className={`loading-screen ${visible ? '' : 'loading-hide'}`} data-testid="loading-screen">
      <div className="loading-inner">
        <div className="loading-heart">❤</div>
        <div className="loading-title">Preparing our little world</div>
        <div className="loading-msg">{msg}</div>
        <div className="loading-bar">
          <div className="loading-fill" style={{ width: `${Math.max(6, progress)}%` }} />
        </div>
        <div className="loading-percent">{Math.floor(progress)}%</div>
      </div>
    </div>
  );
}
