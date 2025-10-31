import { useEffect, useRef } from "react";

interface UseBackgroundMusicParams {
  isMuted: boolean;
  isAdPlaying: boolean;
  gamePhase: 'bet' | 'running' | 'victory';
}

export const useBackgroundMusic = ({ 
  isMuted, 
  isAdPlaying,
  gamePhase 
}: UseBackgroundMusicParams) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio element
  useEffect(() => {
    const audio = new Audio('/src/assets/RPSArenaMusicLoop.mp3');
    audio.loop = true;
    audio.volume = 0.4; // 40% volume
    audioRef.current = audio;
    
    // Cleanup on unmount
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);
  
  // Handle mute/unmute
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isMuted || isAdPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.warn('Audio autoplay blocked:', err);
      });
    }
  }, [isMuted, isAdPlaying]);
  
  // Auto-start on game phase change (user interaction)
  useEffect(() => {
    if (!audioRef.current || isMuted || isAdPlaying) return;
    
    audioRef.current.play().catch(err => {
      console.warn('Audio play failed:', err);
    });
  }, [gamePhase, isMuted, isAdPlaying]);
  
  return { audioRef };
};
