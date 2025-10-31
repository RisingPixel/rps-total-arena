import { Volume2, VolumeX } from "lucide-react";

interface AudioToggleProps {
  isMuted: boolean;
  onToggle: () => void;
}

export const AudioToggle = ({ isMuted, onToggle }: AudioToggleProps) => {
  return (
    <div className="fixed top-4 left-4 z-50">
      <button
        onClick={onToggle}
        className="w-12 h-12 rounded-full bg-slate-900/80 backdrop-blur-sm border border-purple-500/30 hover:bg-slate-800/90 hover:border-purple-500/50 transition-all shadow-lg flex items-center justify-center"
        aria-label={isMuted ? "Unmute music" : "Mute music"}
      >
        {isMuted ? (
          <VolumeX className="h-5 w-5 text-red-400" />
        ) : (
          <Volume2 className="h-5 w-5 text-purple-400" />
        )}
      </button>
    </div>
  );
};
