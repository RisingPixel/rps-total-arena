import { useEffect, useRef, useState } from 'react';

// Declare global PokiSDK type
declare global {
  interface Window {
    PokiSDK: {
      init: () => Promise<void>;
      gameLoadingFinished: () => void;
      gameplayStart: () => void;
      gameplayStop: () => void;
      commercialBreak: (callback?: () => void) => Promise<void>;
      rewardedBreak: (callback?: () => void) => Promise<boolean>;
    };
  }
}

export const usePokiSDK = () => {
  const [isSDKReady, setIsSDKReady] = useState(false);
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Initialize SDK only once
    if (isInitialized.current) return;
    
    const initSDK = async () => {
      try {
        if (window.PokiSDK) {
          await window.PokiSDK.init();
          console.log("Poki SDK successfully initialized");
          setIsSDKReady(true);
          isInitialized.current = true;
          
          // Signal that game loading is finished
          window.PokiSDK.gameLoadingFinished();
        }
      } catch (error) {
        console.log("Poki SDK init error, continuing anyway:", error);
        setIsSDKReady(true);
        isInitialized.current = true;
      }
    };

    initSDK();
  }, []);

  // Gameplay Start
  const gameplayStart = () => {
    if (window.PokiSDK && isSDKReady) {
      window.PokiSDK.gameplayStart();
      console.log("🎮 Poki: gameplayStart");
    }
  };

  // Gameplay Stop
  const gameplayStop = () => {
    if (window.PokiSDK && isSDKReady) {
      window.PokiSDK.gameplayStop();
      console.log("☠ Poki: gameplayStop");
    }
  };

  // Commercial Break (interstitial ad)
  const commercialBreak = async (
    onBreakStart?: () => void,
    onBreakEnd?: () => void
  ) => {
    if (!window.PokiSDK || !isSDKReady) {
      onBreakEnd?.();
      return;
    }

    try {
      setIsAdPlaying(true);
      
      await window.PokiSDK.commercialBreak(() => {
        // Called when ad starts playing
        onBreakStart?.();
        console.log("🎞 Poki: commercialBreak started");
      });
      
      console.log("🎞 Poki: commercialBreak finished");
      setIsAdPlaying(false);
      onBreakEnd?.();
    } catch (error) {
      console.error("Commercial break error:", error);
      setIsAdPlaying(false);
      onBreakEnd?.();
    }
  };

  // Rewarded Break (rewarded ad)
  const rewardedBreak = async (
    onBreakStart?: () => void,
    onReward?: () => void,
    onNoReward?: () => void
  ): Promise<boolean> => {
    if (!window.PokiSDK || !isSDKReady) {
      onNoReward?.();
      return false;
    }

    try {
      setIsAdPlaying(true);
      
      const success = await window.PokiSDK.rewardedBreak(() => {
        // Called when ad starts playing
        onBreakStart?.();
        console.log("🎬 Poki: rewardedBreak started");
      });
      
      setIsAdPlaying(false);
      
      if (success) {
        console.log("🎬 Poki: rewardedBreak success - giving reward");
        onReward?.();
        return true;
      } else {
        console.log("🎬 Poki: rewardedBreak no ad shown");
        onNoReward?.();
        return false;
      }
    } catch (error) {
      console.error("Rewarded break error:", error);
      setIsAdPlaying(false);
      onNoReward?.();
      return false;
    }
  };

  return {
    isSDKReady,
    isAdPlaying,
    gameplayStart,
    gameplayStop,
    commercialBreak,
    rewardedBreak,
  };
};
