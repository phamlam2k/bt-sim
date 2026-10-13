import { Onboarding } from './screens/Onboarding';
import { Summary } from './screens/Summary';
import { Desktop } from './shell/Desktop';
import { useStore } from './store';

export function App() {
  const phase = useStore((s) => s.game?.phase);
  if (!phase) return <Onboarding />;
  if (phase === 'dayEnd') return <Summary />;
  return <Desktop />;
}
