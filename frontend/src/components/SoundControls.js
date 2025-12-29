import { useSound } from '../context/SoundContext';
import { Button } from './ui/button';
import { 
  Volume2, VolumeX, Music, Music2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from './ui/dropdown-menu';

export default function SoundControls({ variant = 'dropdown' }) {
  const { soundEnabled, musicEnabled, toggleSound, toggleMusic, playSound } = useSound();

  const handleToggleSound = () => {
    toggleSound();
    // Play a click sound if enabling
    if (!soundEnabled) {
      setTimeout(() => playSound('click'), 100);
    }
  };

  if (variant === 'simple') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggleSound}
        className="relative"
        title={soundEnabled ? 'Sound ausschalten' : 'Sound einschalten'}
      >
        {soundEnabled ? (
          <Volume2 className="w-5 h-5 text-blue-600" />
        ) : (
          <VolumeX className="w-5 h-5 text-slate-400" />
        )}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          title="Sound-Einstellungen"
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5 text-blue-600" />
          ) : (
            <VolumeX className="w-5 h-5 text-slate-400" />
          )}
          {musicEnabled && soundEnabled && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-blue-900">
          🔊 Sound-Einstellungen
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleToggleSound}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
              <span>Soundeffekte</span>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
              soundEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {soundEnabled ? 'AN' : 'AUS'}
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={toggleMusic}
          disabled={!soundEnabled}
          className={`cursor-pointer ${!soundEnabled ? 'opacity-50' : ''}`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {musicEnabled && soundEnabled ? (
                <Music className="w-4 h-4 text-emerald-500" />
              ) : (
                <Music2 className="w-4 h-4 text-slate-400" />
              )}
              <span>Hintergrundmusik</span>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
              musicEnabled && soundEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {musicEnabled && soundEnabled ? 'AN' : 'AUS'}
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 py-2 text-xs text-slate-500">
          Sanfte Sounds für ein angenehmes Lernerlebnis
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
