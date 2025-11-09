export default function TempoWheel({ rotation, wheelRef, bpm, isPlaying, onToggleMetronome }) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-6">
      <div className="relative w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] md:w-[400px] md:h-[400px]">
        {/* Outer ring with tick marks */}
        <div
          className="relative w-full h-full rounded-full cursor-grab active:cursor-grabbing"
          style={{
            background: 'radial-gradient(circle, var(--color-bg-tertiary) 0%, var(--color-bg-secondary) 100%)',
            boxShadow: '0 0 0 1px var(--color-glass-border), 0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 30px rgba(0, 217, 255, 0.05)'
          }}
          ref={wheelRef}
        >
          {/* Rotating tick marks */}
          <div
            className="absolute inset-0 rounded-full transition-transform duration-100"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {/* Major tick marks (12, 3, 6, 9 o'clock) */}
            {[0, 90, 180, 270].map((angle, i) => (
              <div
                key={`major-${i}`}
                className="absolute w-1 h-6 sm:h-7 bg-[var(--color-accent-cyan)] rounded-full"
                style={{
                  top: angle === 0 ? '0' : angle === 180 ? 'auto' : '50%',
                  bottom: angle === 180 ? '0' : 'auto',
                  left: angle === 90 ? 'auto' : angle === 270 ? '0' : '50%',
                  right: angle === 90 ? '0' : 'auto',
                  transform: angle === 0 || angle === 180 ? 'translateX(-50%)' : 'translateY(-50%)',
                  boxShadow: '0 0 8px rgba(0, 217, 255, 0.6)'
                }}
              />
            ))}
            
            {/* Minor tick marks (every 30 degrees) */}
            {[30, 60, 120, 150, 210, 240, 300, 330].map((angle, i) => (
              <div
                key={`minor-${i}`}
                className="absolute w-0.5 h-3 sm:h-4 bg-[var(--color-glass-border)] rounded-full"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${angle}deg) translateY(-${140 + (i % 2) * 10}px) translateX(-50%)`,
                  transformOrigin: 'center',
                  opacity: 0.6
                }}
              />
            ))}
          </div>

          {/* Inner circle */}
          <div 
            className="absolute inset-[15%] rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%)',
              boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--color-glass-border)'
            }}
          >
            {/* Play/Pause button */}
            <button 
              className={`wheel-play-btn w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 ${
                isPlaying 
                  ? 'bg-[var(--color-accent-cyan)] text-black shadow-[0_0_30px_rgba(0,217,255,0.6)]' 
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-accent-cyan)] border-2 border-[var(--color-glass-border)]'
              } hover:scale-105 active:scale-95`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onToggleMetronome()
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <span className="text-2xl sm:text-3xl">{isPlaying ? '⏸' : '▶'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

