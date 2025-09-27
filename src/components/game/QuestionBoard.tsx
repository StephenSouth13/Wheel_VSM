import React, { useState, useEffect, useRef } from 'react';
import { useGame } from './GameContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Clock, CheckCircle, XCircle, Gift } from 'lucide-react';

export const QuestionBoard: React.FC = () => {
  const { state, dispatch } = useGame();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(state.timeLimit);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [showEffect, setShowEffect] = useState<'correct' | 'incorrect' | null>(null);
  
  const correctAudioRef = useRef<HTMLAudioElement>(null);
  const incorrectAudioRef = useRef<HTMLAudioElement>(null);
  const backgroundMusicRef = useRef<HTMLAudioElement>(null);

  // Create audio elements
  useEffect(() => {
    // Create correct answer sound (celebration melody)
    const correctAudio = new Audio();
    const correctAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const createCorrectSound = () => {
      const oscillator = correctAudioContext.createOscillator();
      const gainNode = correctAudioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(correctAudioContext.destination);
      
      oscillator.frequency.setValueAtTime(523.25, correctAudioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, correctAudioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, correctAudioContext.currentTime + 0.2); // G5
      oscillator.frequency.setValueAtTime(1046.50, correctAudioContext.currentTime + 0.3); // C6
      
      gainNode.gain.setValueAtTime(0.3, correctAudioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, correctAudioContext.currentTime + 0.5);
      
      oscillator.start(correctAudioContext.currentTime);
      oscillator.stop(correctAudioContext.currentTime + 0.5);
    };
    
    // Create incorrect answer sound (descending notes)
    const createIncorrectSound = () => {
      const incorrectAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = incorrectAudioContext.createOscillator();
      const gainNode = incorrectAudioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(incorrectAudioContext.destination);
      
      oscillator.frequency.setValueAtTime(400, incorrectAudioContext.currentTime); // G4
      oscillator.frequency.setValueAtTime(350, incorrectAudioContext.currentTime + 0.1); // F4
      oscillator.frequency.setValueAtTime(300, incorrectAudioContext.currentTime + 0.2); // D4
      
      gainNode.gain.setValueAtTime(0.2, incorrectAudioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, incorrectAudioContext.currentTime + 0.3);
      
      oscillator.start(incorrectAudioContext.currentTime);
      oscillator.stop(incorrectAudioContext.currentTime + 0.3);
    };
    
    correctAudioRef.current = { play: createCorrectSound } as any;
    incorrectAudioRef.current = { play: createIncorrectSound } as any;
    
    // Background music loop
    const createBackgroundMusic = () => {
      const bgAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      let isPlaying = false;
      
      const playNote = (frequency: number, duration: number, startTime: number) => {
        const oscillator = bgAudioContext.createOscillator();
        const gainNode = bgAudioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(bgAudioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.05, startTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const playMelody = () => {
        if (!isPlaying) return;
        
        const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00]; // C5, D5, E5, F5, G5, A5
        const startTime = bgAudioContext.currentTime;
        
        notes.forEach((note, index) => {
          playNote(note, 0.8, startTime + index * 0.5);
        });
        
        setTimeout(() => playMelody(), 3000);
      };
      
      return {
        play: () => {
          isPlaying = true;
          playMelody();
        },
        pause: () => {
          isPlaying = false;
        }
      };
    };
    
    backgroundMusicRef.current = createBackgroundMusic() as any;
    
    return () => {
      if (backgroundMusicRef.current) {
        (backgroundMusicRef.current as any).pause();
      }
    };
  }, []);

  useEffect(() => {
    if (state.currentQuestion && !state.showResult) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Time's up - show correct answer
            setShowCorrectAnswer(true);
            dispatch({ type: 'ANSWER_QUESTION', payload: { correct: false } });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [state.currentQuestion, state.showResult, dispatch]);

  useEffect(() => {
    // Reset timer when new question starts or when question is reset
    if (state.currentQuestion) {
      if (state.playerAttempts === 0) {
        // New question or reset - use the current time limit
        setTimeLeft(state.timeLimit);
        setSelectedAnswer(null);
        setShowCorrectAnswer(false);
      }
    }
  }, [state.currentQuestion, state.playerAttempts, state.timeLimit]);

  // Separate effect to handle timeLimit changes (for reset functionality)
  useEffect(() => {
    if (state.currentQuestion && state.playerAttempts === 0) {
      setTimeLeft(state.timeLimit);
    }
  }, [state.timeLimit]);

  // Start background music when questions start
  useEffect(() => {
    if (state.currentQuestion && backgroundMusicRef.current) {
      (backgroundMusicRef.current as any).play();
    }
    
    return () => {
      if (backgroundMusicRef.current) {
        (backgroundMusicRef.current as any).pause();
      }
    };
  }, [state.currentQuestion]);

  // Early return after all hooks have been called
  if (state.currentScreen !== 'questions') return null;

  const selectRandomQuestion = () => {
    const availableQuestions = state.questions.filter(
      q => !state.selectedQuestions.includes(q.id)
    );
    
    if (availableQuestions.length > 0) {
      const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
      dispatch({ type: 'START_QUESTION', payload: randomQuestion });
    }
  };

  const handleAnswerClick = (answerIndex: number) => {
    if (state.showResult || selectedAnswer !== null) return;
    
    setSelectedAnswer(answerIndex);
    const isCorrect = answerIndex === state.currentQuestion?.correct;
    
    // Play sound and show effect immediately
    if (isCorrect) {
      correctAudioRef.current?.play();
      setShowEffect('correct');
    } else {
      incorrectAudioRef.current?.play();
      setShowEffect('incorrect');
    }
    
    setTimeout(() => {
      dispatch({ type: 'ANSWER_QUESTION', payload: { correct: isCorrect } });
      
      // Show correct answer immediately after second wrong attempt
      if (!isCorrect && state.playerAttempts >= 1) {
        setShowCorrectAnswer(true);
      }
      
      setShowEffect(null);
    }, 1000);
  };

  const resetQuestion = () => {
    dispatch({ type: 'RESET_QUESTION' });
  };

  const returnToWheel = () => {
    // Mark question as completed if answered correctly
    if (state.lastAnswer === 'correct' && state.currentQuestion) {
      dispatch({ type: 'COMPLETE_QUESTION', payload: state.currentQuestion.id });
    }
    
    setTimeout(() => {
      dispatch({ type: 'RETURN_TO_WHEEL' });
    }, 2000);
  };

  const canResetQuestion = () => {
    if (!state.currentQuestion) return false;
    const attempts = state.questionAttempts[state.currentQuestion.id] || 0;
    // Only allow reset after first wrong attempt, not after second
    return attempts < 2 && state.lastAnswer === 'incorrect' && state.playerAttempts === 2;
  };

  const renderQuestionNumbers = () => {
    return (
      <div className="grid grid-cols-5 gap-4 mb-8">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
          <button
            key={num}
            onClick={() => state.selectedQuestions.includes(num) ? null : selectRandomQuestion()}
            disabled={state.selectedQuestions.includes(num)}
            className={`
              w-16 h-16 rounded-full border-4 font-bold text-xl transition-all duration-300
              ${state.selectedQuestions.includes(num)
                ? 'bg-muted border-muted-foreground text-muted-foreground cursor-not-allowed'
                : 'bg-game-gold border-game-white text-white neumorphism hover:scale-110 sparkle-animation'
              }
            `}
          >
            {num}
          </button>
        ))}
      </div>
    );
  };

  const getAnswerButtonClass = (index: number) => {
    const baseClass = "w-full p-4 text-left rounded-xl border-2 transition-all duration-300 font-medium";
    
    if (!state.showResult && selectedAnswer === null) {
      return `${baseClass} bg-card border-border hover:border-primary hover:bg-primary/10 cursor-pointer hover:scale-105 hover:shadow-lg`;
    }
    
    if (selectedAnswer === index) {
      const isCorrect = index === state.currentQuestion?.correct;
      return `${baseClass} ${
        isCorrect 
          ? 'bg-green-500/30 border-green-400 text-green-300 glow shadow-green-500/50 scale-105' 
          : 'bg-red-500/30 border-red-400 text-red-300 shake shadow-red-500/50'
      }`;
    }
    
    if (showCorrectAnswer && index === state.currentQuestion?.correct) {
      return `${baseClass} bg-green-500/30 border-green-400 text-green-300 pulse-glow shadow-green-500/50 glow`;
    }
    
    return `${baseClass} bg-card border-border opacity-50`;
  };

  return (
    <div className={`w-full max-w-4xl mx-auto p-6 relative ${
      showEffect === 'correct' ? 'animate-pulse bg-green-500/10' : 
      showEffect === 'incorrect' ? 'animate-bounce bg-red-500/10' : ''
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="outline"
          onClick={() => dispatch({ type: 'RETURN_TO_WHEEL' })}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về vòng quay</span>
        </Button>
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-game-white mb-1">
            Người chơi ghế số {state.selectedSeat}
          </h2>
          <p className="text-muted-foreground">Chọn câu hỏi và trả lời đúng để nhận quà!</p>
        </div>
        
        <div className="w-32"></div> {/* Spacer */}
      </div>

      {/* Question Numbers */}
      {!state.currentQuestion && (
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-6 text-game-white">
            Chọn một câu hỏi:
          </h3>
          {renderQuestionNumbers()}
        </div>
      )}

      {/* Question Display */}
      {state.currentQuestion && (
        <div className="glassmorphism rounded-2xl p-8 mb-6 fade-in">
          {/* Timer */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Clock className={`w-5 h-5 ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-game-blue'}`} />
              <span className={`font-bold ${timeLeft <= 5 ? 'text-red-400' : 'text-game-blue'}`}>
                {timeLeft}s
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Lần thử: {state.playerAttempts + 1}/2
            </div>
          </div>

          {/* Progress Bar */}
          <Progress 
            value={(state.timeLimit - timeLeft) / state.timeLimit * 100} 
            className={`mb-6 h-3 ${timeLeft <= 5 ? 'animate-pulse ring-2 ring-red-400' : ''}`}
          />

          {/* Question */}
          <h3 className="text-2xl font-semibold mb-8 text-game-white leading-relaxed">
            {state.currentQuestion.question}
          </h3>

          {/* Answer Options */}
          <div className="grid gap-4 mb-6">
            {state.currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerClick(index)}
                disabled={state.showResult || selectedAnswer !== null}
                className={getAnswerButtonClass(index)}
              >
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Result Display */}
          {state.showResult && (
            <div className="text-center bounce-in">
              {state.lastAnswer === 'correct' ? (
                <div className="text-green-400 mb-4 relative">
                  <div className="absolute inset-0 bg-green-500/20 rounded-2xl animate-pulse"></div>
                  <div className="relative z-10">
                    <CheckCircle className="w-20 h-20 mx-auto mb-2 text-green-300 animate-bounce drop-shadow-lg" />
                    <div className="text-4xl mb-2">🎊🎉✨</div>
                    <h4 className="text-3xl font-bold mb-2 gradient-text animate-pulse">Chính xác!</h4>
                    <p className="text-xl mb-4 text-green-300">Chúc mừng! Bạn đã trả lời đúng!</p>
                    <div className="flex items-center justify-center space-x-2 text-game-gold animate-bounce">
                      <Gift className="w-8 h-8 animate-spin" />
                      <span className="font-bold text-2xl glow">Nhận quà ngay!</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-red-400 mb-4 relative">
                  <div className="absolute inset-0 bg-red-500/20 rounded-2xl animate-pulse"></div>
                  <div className="relative z-10">
                    <XCircle className="w-20 h-20 mx-auto mb-2 text-red-300 shake animate-pulse" />
                    <div className="text-4xl mb-2">😞💔❌</div>
                    <h4 className="text-3xl font-bold mb-2 text-red-300">
                      {state.playerAttempts >= 2 ? 'Hết lượt thử!' : 'Chưa đúng!'}
                    </h4>
                    <p className="text-lg mb-4">
                      {state.playerAttempts >= 2 && !canResetQuestion()
                        ? 'Đáp án đúng đã được highlight.' 
                        : state.playerAttempts >= 2 
                          ? 'Bạn còn 1 lần thử nữa!' 
                          : 'Bạn còn 1 lần thử nữa!'}
                    </p>
                    
                    {canResetQuestion() && (
                      <Button
                        onClick={resetQuestion}
                        className="mb-4 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-2 rounded-xl mr-4"
                      >
                        🔄 Thử lại (10s)
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Explanation Section */}
              {(showCorrectAnswer || state.lastAnswer === 'correct') && state.currentQuestion && (
                <div className="glassmorphism rounded-xl p-6 mb-6 bg-blue-500/10 border border-blue-500/20 fade-in">
                  <h5 className="text-lg font-bold text-blue-300 mb-3 flex items-center justify-center">
                    💡 Giải thích
                  </h5>
                  <p className="text-muted-foreground leading-relaxed">
                    {state.currentQuestion.explanation}
                  </p>
                </div>
              )}
              
              <Button
                onClick={returnToWheel}
                className="mt-4 bg-game-gold hover:bg-game-gold/90 text-white font-bold px-8 py-3 rounded-xl"
              >
                Tiếp tục chơi
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};