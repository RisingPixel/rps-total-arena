import { useEffect, useRef, useState } from "react";

export const useAnimatedCounter = (target: number, duration: number = 300) => {
  const [current, setCurrent] = useState(target);
  const prevTargetRef = useRef(target);

  useEffect(() => {
    if (prevTargetRef.current === target) return;
    
    const start = prevTargetRef.current;
    const diff = target - start;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
      
      setCurrent(Math.round(start + diff * easeOut));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevTargetRef.current = target;
      }
    };
    
    animate();
  }, [target, duration]);
  
  return current;
};
