import { useEffect, useRef } from "react";
import musicFile from '@/assets/RPSArenaMusicLoop.mp3';

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
  const audioContextRef = useRef<AudioContext | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  
  // Initialize Web Audio API with low-pass filter
  useEffect(() => {
    const audio = new Audio(musicFile);
    audio.loop = true;
    audio.volume = 0.4;
    audioRef.current = audio;

    // Setup Web Audio API for dynamic filtering
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaElementSource(audio);
      const filter = audioContext.createBiquadFilter();
      
      // Configure low-pass filter
      filter.type = 'lowpass';
      filter.frequency.value = 20000; // Default: no filtering (full spectrum)
      filter.Q.value = 1.0;
      
      // Audio routing: Audio → Filter → Speakers
      source.connect(filter);
      filter.connect(audioContext.destination);
      
      audioContextRef.current = audioContext;
      filterRef.current = filter;
      sourceRef.current = source;
    } catch (err) {
      console.warn('Web Audio API not supported, fallback to normal audio:', err);
    }

    // Cleanup on unmount
    return () => {
      audio.pause();
      audio.src = '';
      audioContextRef.current?.close();
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

  // Apply dynamic low-pass filter based on game phase
  useEffect(() => {
    if (!filterRef.current || !audioContextRef.current) return;

    const filter = filterRef.current;
    const audioContext = audioContextRef.current;

    // Resume AudioContext (autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    // Smooth transition (3 seconds)
    const transitionTime = 3.0;

    if (gamePhase === 'bet' || gamePhase === 'victory') {
      // Filtered: Low frequency cutoff → "muffled/distant" sound
      filter.frequency.setTargetAtTime(
        400,  // Hz (cuts frequencies above 400 Hz)
        audioContext.currentTime,
        transitionTime
      );
      filter.Q.setTargetAtTime(
        2.0,  // Increased resonance for pronounced effect
        audioContext.currentTime,
        transitionTime
      );
    } else if (gamePhase === 'running') {
      // Normal: Full spectrum (no filtering)
      filter.frequency.setTargetAtTime(
        20000, // Hz (full audible spectrum)
        audioContext.currentTime,
        transitionTime
      );
      filter.Q.setTargetAtTime(
        1.0,
        audioContext.currentTime,
        transitionTime
      );
    }
  }, [gamePhase]);
  
  return { audioRef };
};
