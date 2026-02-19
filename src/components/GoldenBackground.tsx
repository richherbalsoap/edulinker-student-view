const GoldenBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <div className="absolute inset-0 golden-grid-bg opacity-15"></div>
      <div className="absolute inset-0">
        {[10, 25, 45, 70, 85, 35, 60].map((left, i) => (
          <div
            key={i}
            className="golden-falling-line"
            style={{
              left: `${left}%`,
              animationDuration: `${4 + (i % 3) * 1.5}s`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
      </div>
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[hsl(51,100%,50%,0.1)] to-transparent"></div>
      <div className="golden-horizon-ring"></div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60vw] h-[200px] bg-[hsl(51,100%,50%,0.05)] blur-[60px] rounded-full"></div>
    </div>
  );
};

export default GoldenBackground;
