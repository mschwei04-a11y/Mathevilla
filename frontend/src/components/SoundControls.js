import { useSound } from '../context/SoundContext';
import { Button } from './ui/button';
import { Volume2, VolumeX } from 'lucide-react';

export default function SoundControls() {
  const { soundEnabled, toggleSound, playSound } = useSound();

  const handleToggle = () => {
    toggleSound();
    if (!soundEnabled) {
      setTimeout(() => playSound('click'), 100);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className="relative"
      title={soundEnabled ? 'Sound ausschalten' : 'Sound einschalten'}
    >
      {soundEnabled ? (
        <Volume2 className="w-5 h-5 text-emerald-600" />
      ) : (
        <VolumeX className="w-5 h-5 text-slate-400" />
      )}
    </Button>
  );
}
