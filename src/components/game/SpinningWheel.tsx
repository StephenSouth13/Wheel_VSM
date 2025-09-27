import React, { useState, useRef, useEffect } from 'react';
import { useGame } from './GameContext';
import { Button } from '@/components/ui/button';
import { Play, Trophy, Volume2 } from 'lucide-react';

export const SpinningWheel: React.FC = () => {
  const { state, dispatch } = useGame();
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [highlightedSegment, setHighlightedSegment] = useState<number | null>(null);
  const wheelRef = useRef<SVGGElement>(null);
  const spinAudioRef = useRef<HTMLAudioElement>(null);
  const winAudioRef = useRef<HTMLAudioElement>(null);

  // Create audio elements
  useEffect(() => {
    // Create spin sound (using a simple oscillator for demo)
    if (typeof window !== 'undefined') {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const createSpinSound = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      };

      if (isSpinning && !spinAudioRef.current) {
        const interval = setInterval(createSpinSound, 200);
        spinAudioRef.current = interval as any;
      }
    }

    return () => {
      if (spinAudioRef.current) {
        clearInterval(spinAudioRef.current as any);
        spinAudioRef.current = null;
      }
    };
  }, [isSpinning]);

  if (state.currentScreen !== 'wheel') return null;

  const spinWheel = () => {
    if (isSpinning || state.availableSeats.length === 0) return;

    setIsSpinning(true);
    setSelectedNumber(null);

    // Random selection from available seats
    const randomIndex = Math.floor(Math.random() * state.availableSeats.length);
    const selectedSeat = state.availableSeats[randomIndex];

    // Calculate rotation for smooth landing
    const segmentAngle = 360 / state.maxSeats;
    const baseRotations = 10; // 10 full rotations
    const baseRotation = baseRotations * 360;
    
    // Calculate target angle (pointer is at top, so we need to adjust)
    const targetSegmentAngle = (selectedSeat - 1) * segmentAngle;
    const finalRotation = baseRotation + (360 - targetSegmentAngle);

    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${finalRotation}deg)`;
      wheelRef.current.style.transition = 'transform 10s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    }

    // Highlight segments during spin
    let highlightInterval: NodeJS.Timeout;
    highlightInterval = setInterval(() => {
      const randomHighlight = Math.ceil(Math.random() * state.maxSeats);
      setHighlightedSegment(randomHighlight);
    }, 100);

    // Stop spinning after 10 seconds
    setTimeout(() => {
      clearInterval(highlightInterval);
      setHighlightedSegment(null);
      setIsSpinning(false);
      setSelectedNumber(selectedSeat);
      
      // Play win sound
      if (typeof window !== 'undefined') {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(554, audioContext.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.4);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1);
      }

      setTimeout(() => {
        dispatch({ type: 'SELECT_SEAT', payload: selectedSeat });
      }, 2000);
    }, 10000);
  };

  const renderWheelSegments = () => {
    const segments = [];
    const segmentAngle = 360 / state.maxSeats;
    
    for (let i = 1; i <= state.maxSeats; i++) {
      const isEven = i % 2 === 0;
      const isAvailable = state.availableSeats.includes(i);
      const isHighlighted = highlightedSegment === i;
      
      // Create segment path
      const startAngle = (i - 1) * segmentAngle - 90; // -90 to start from top
      const endAngle = i * segmentAngle - 90;
      
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;
      
      const centerX = 160; // Half of wheel width (320px)
      const centerY = 160;
      const radius = 150;
      
      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);
      
      const largeArcFlag = segmentAngle > 180 ? 1 : 0;
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
      
      // Text position
      const textAngle = startAngle + segmentAngle / 2;
      const textAngleRad = (textAngle * Math.PI) / 180;
      const textRadius = 120;
      const textX = centerX + textRadius * Math.cos(textAngleRad);
      const textY = centerY + textRadius * Math.sin(textAngleRad) + 5;
      
      segments.push(
        <g key={i}>
          <path
            d={pathData}
            fill={isEven ? '#3B82F6' : '#EF4444'}
            stroke="#ffffff"
            strokeWidth="2"
            className={`
              transition-all duration-200
              ${!isAvailable ? 'opacity-30' : 'opacity-100'}
              ${isHighlighted ? 'brightness-150 drop-shadow-lg' : ''}
            `}
            style={{
              filter: isHighlighted ? 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))' : undefined
            }}
          />
          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            dominantBaseline="middle"
            className={`
              fill-white font-bold text-lg select-none
              ${isHighlighted ? 'animate-pulse' : ''}
              ${!isAvailable ? 'opacity-50' : ''}
            `}
            style={{ 
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              fontSize: state.maxSeats > 40 ? '14px' : '18px'
            }}
          >
            {i}
          </text>
        </g>
      );
    }
    return segments;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.1),transparent_70%)]"></div>
      
      {/* Main Container */}
      <div className="relative z-10 flex flex-col items-center space-y-12">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 bg-clip-text text-transparent mb-4">
            VÒNG QUAY MAY MẮN
          </h1>
          <p className="text-xl text-slate-300">Quay để chọn người chơi tiếp theo!</p>
        </div>

        {/* Wheel Container - Perfect Centering */}
        <div className="relative flex items-center justify-center">
          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400/20 to-orange-500/20 blur-xl scale-110"></div>
          
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-6 z-30">
            <div className="relative">
              <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-b-[40px] border-l-transparent border-r-transparent border-b-yellow-400 drop-shadow-2xl"></div>
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-3 h-6 bg-yellow-400 rounded-full"></div>
            </div>
          </div>

          {/* Wheel */}
          <div className="relative">
            <svg
              width="320"
              height="320"
              className="drop-shadow-2xl"
              style={{ filter: 'drop-shadow(0 0 30px rgba(255, 215, 0, 0.3))' }}
            >
              <g ref={wheelRef} style={{ transformOrigin: '160px 160px' }}>
                {renderWheelSegments()}
              </g>
              
              {/* Center Circle */}
              <circle
                cx="160"
                cy="160"
                r="25"
                fill="url(#centerGradient)"
                stroke="#ffffff"
                strokeWidth="4"
                className="drop-shadow-lg"
              />
              
              {/* Gradient Definitions */}
              <defs>
                <radialGradient id="centerGradient" cx="50%" cy="30%">
                  <stop offset="0%" stopColor="#FCD34D" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </radialGradient>
              </defs>
            </svg>
            
            {/* Center Trophy */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <Trophy className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
          </div>
        </div>

        {/* Spin Button */}
        <div className="flex flex-col items-center space-y-6">
          <Button
            onClick={spinWheel}
            disabled={isSpinning || state.availableSeats.length === 0}
            size="lg"
            className={`
              relative px-16 py-8 text-3xl font-black rounded-2xl border-4 border-yellow-300
              transition-all duration-300 transform-gpu
              ${isSpinning 
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed border-slate-500 scale-95' 
                : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-2xl hover:shadow-yellow-500/50 hover:scale-110 active:scale-105'
              }
            `}
            style={{
              background: isSpinning ? undefined : 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 50%, #EA580C 100%)',
              boxShadow: isSpinning ? undefined : '0 25px 50px -12px rgba(251, 191, 36, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.2) inset'
            }}
          >
            <div className="flex items-center space-x-3">
              {isSpinning ? (
                <Volume2 className="w-8 h-8 animate-pulse" />
              ) : (
                <Play className="w-8 h-8" />
              )}
              <span>{isSpinning ? 'ĐANG QUAY...' : 'QUAY NGAY'}</span>
            </div>
            
            {/* Button glow effect */}
            {!isSpinning && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/20 to-orange-500/20 blur-xl -z-10 scale-110"></div>
            )}
          </Button>

          {/* Available Seats Counter */}
          <div className="text-center bg-black/20 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/10">
            <p className="text-slate-300 text-lg">
              Còn lại: <span className="text-yellow-400 font-bold text-2xl">{state.availableSeats.length}</span> ghế
            </p>
          </div>
        </div>

        {/* Result Display */}
        {selectedNumber && !isSpinning && (
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-3xl p-8 border border-green-500/30 animate-bounce">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-yellow-400 mb-4">
                Chúc Mừng!
              </h2>
              <p className="text-2xl text-white mb-2">
                Người chơi ghế số
              </p>
              <div className="text-6xl font-black text-yellow-400 mb-4 animate-pulse">
                {selectedNumber}
              </div>
              <p className="text-slate-300 text-lg">
                Sẵn sàng trả lời câu hỏi thôi nào! 🚀
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Floating particles effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};