interface CountdownOverlayProps {
  countdown: number;
}

export const CountdownOverlay = ({ countdown }: CountdownOverlayProps) => {
  return (
    <div className="countdown-overlay">
      <div className="countdown-number">
        {countdown === 0 ? 'GO!' : countdown}
      </div>
    </div>
  );
};
