  import React, { createContext, useContext, useReducer, ReactNode, useState, useEffect, useCallback } from 'react';

  // --- I. TYPES AND DATA ---

  export interface Question {
    id: number;
    question: string;
    options: string[];
    correct: number;
    explanation: string;
    type?: string; 
  }

  interface GameState {
    currentScreen: 'setup' | 'wheel' | 'questions';
    selectedSeat: number | null;
    availableSeats: number[];
    questions: Question[];
    selectedQuestions: number[];
    questionAttempts: Record<number, number>; 
    currentQuestion: Question | null;
    playerAttempts: number;
    showResult: boolean;
    lastAnswer: 'correct' | 'incorrect' | null;
    timeLimit: number; 
    maxSeats: number; 
  }

  type GameAction =
    | { type: 'SELECT_SEAT'; payload: number }
    | { type: 'START_QUESTION'; payload: Question }
    | { type: 'ANSWER_QUESTION'; payload: { correct: boolean } }
    | { type: 'RESET_QUESTION' }
    | { type: 'COMPLETE_QUESTION'; payload: number }
    | { type: 'RETURN_TO_WHEEL' }
    | { type: 'SHOW_RESULT'; payload: boolean }
    | { type: 'RESET_ATTEMPTS' }
    | { type: 'SET_MAX_SEATS'; payload: number }
    | { type: 'START_GAME' };

  const gameQuestions: Question[] = [
    {
      id: 1,
      question: '“Willpower” trong cụm từ Willpower Generation có nghĩa là gì?',
      options: ['Tài năng bẩm sinh', 'Ý chí – nghị lực', 'May mắn', 'Sức mạnh cơ bắp'],
      correct: 1,
      explanation: 'Willpower có nghĩa là ý chí hay nghị lực, sức mạnh tinh thần giúp vượt qua khó khăn.'
    },
    {
      id: 2,
      question: 'VSM là viết tắt của cụm từ nào?',
      options: ['Vietnam Student Marathon', 'Vietnam Sports Marathon', 'Viet Student Movement', 'Viet Spirit Marathon'],
      correct: 0,
      explanation: 'VSM là viết tắt của Vietnam Student Marathon, cuộc thi chạy dành cho sinh viên Việt Nam.'
    },
    {
      id: 3,
      question: 'Câu nói nào sau đây truyền cảm hứng về ý chí vượt khó?',
      options: ['“Ý chí mạnh mẽ có thể biến điều không thể thành có thể.”', '“Chỉ cần may mắn là đủ để thành công.”', '“Đừng làm gì cả, mọi thứ sẽ tự đến.”', '“Thử thách càng ít càng dễ thành công.”'],
      correct: 0,
      explanation: 'Câu nói "Ý chí mạnh mẽ..." nhấn mạnh vai trò của ý chí trong việc biến những mục tiêu khó khăn thành hiện thực.'
    },
    { 
      id: 4,
      question: 'Theo bạn, điều gì giúp sinh viên rèn luyện ý chí tốt nhất?',
      options: ['Chạy bộ và thể thao', 'Học tập – vượt qua deadline', 'Tham gia hoạt động cộng đồng', 'Tất cả các đáp án trên'],
      correct: 3,
      explanation: 'Tất cả các hoạt động trên đều giúp sinh viên rèn luyện ý chí, từ sự kiên trì trong thể thao, kỷ luật trong học tập, đến tinh thần trách nhiệm trong cộng đồng.'
    },
    {
      id: 5,
      question: 'Tinh thần “Willpower Generation” hướng sinh viên tới điều gì?',
      options: ['Lối sống lành mạnh, kỷ luật và vượt giới hạn bản thân', 'Nghỉ ngơi nhiều hơn, ít thử thách hơn', 'Chỉ tập trung vào giải trí', 'Không cần rèn luyện'],
      correct: 0,
      explanation: 'Tinh thần "Willpower Generation" khuyến khích sinh viên sống có kỷ luật, lành mạnh và không ngừng vượt qua giới hạn của bản thân.'
    },
    {
      id: 6,
      question: 'Khẩu hiệu chính của VSM 2025 là gì?',
      options: ['“Chạy vì sức khỏe”', '“Chạy vì tương lai”', '“Chạy vì niềm vui”', 'Tất cả đều sai'],
      correct: 1,
      explanation: 'Khẩu hiệu chính của VSM 2025 là "Chạy vì tương lai", nhằm kêu gọi sinh viên rèn luyện sức bền và ý chí cho một tương lai tốt đẹp.'
    },
    {
      id: 7,
      question: 'Yếu tố nào dưới đây KHÔNG giúp rèn luyện ý chí bền bỉ?',
      options: ['Lập mục tiêu rõ ràng', 'Duy trì kỷ luật cá nhân', 'Thường xuyên bỏ dở giữa chừng', 'Biến thất bại thành bài học'],
      correct: 2,
      explanation: 'Việc "thường xuyên bỏ dở giữa chừng" là yếu tố phá vỡ ý chí và sự bền bỉ, trái ngược với việc rèn luyện.'
    },
    // 3 câu tự luận (essay)
    {
  id: 8,
  question: 'Thói quen nhỏ nào dưới đây giúp bạn rèn luyện sự bền bỉ mỗi ngày?',
  options: [
    'Thức dậy và dọn giường ngay lập tức',
    'Ghi chép mục tiêu và việc đã hoàn thành',
    'Tập thể dục hoặc thiền ít nhất 10 phút',
    'Tất cả các đáp án trên'
  ],
  correct: 3,
  explanation: 'Mọi thói quen tích cực, từ việc dọn giường, ghi chép đến rèn luyện thể chất đều góp phần xây dựng tính kiên trì và ý chí.'
},
{
  id: 9,
  question: 'Câu nói truyền cảm hứng nào sau đây thể hiện sức mạnh của ý chí?',
  options: [
    '“Thất bại chỉ là cơ hội để bắt đầu lại thông minh hơn.”',
    '“May mắn quan trọng hơn mọi nỗ lực.”',
    '“Đừng làm gì cả, thành công sẽ tự tìm đến.”',
    '“Chỉ cần mong muốn, không cần hành động.”'
  ],
  correct: 0,
  explanation: 'Câu nói “Thất bại chỉ là cơ hội để bắt đầu lại thông minh hơn” nhấn mạnh sự kiên cường và tinh thần không bỏ cuộc.'
},
{
  id: 10,
  question: 'Khi đối mặt với thất bại, hành động nào giúp bạn lấy lại tinh thần tốt nhất?',
  options: [
    'Phân tích nguyên nhân và lập kế hoạch mới',
    'Tạm thời nghỉ ngơi để phục hồi năng lượng',
    'Chia sẻ và nhận hỗ trợ từ bạn bè, gia đình',
    'Kết hợp cả ba cách trên'
  ],
  correct: 3,
  explanation: 'Kết hợp phân tích, nghỉ ngơi và tìm kiếm sự hỗ trợ giúp phục hồi tinh thần và tiếp tục tiến lên hiệu quả nhất.'
}

  ];

  const initialState: GameState = {
    currentScreen: 'setup',
    selectedSeat: null,
    availableSeats: Array.from({ length: 60 }, (_, i) => i + 1),
    questions: gameQuestions,
    selectedQuestions: [],
    questionAttempts: {},
    currentQuestion: null,
    playerAttempts: 0,
    showResult: false,
    lastAnswer: null,
    timeLimit: 15, 
    maxSeats: 60
  };

  const gameReducer = (state: GameState, action: GameAction): GameState => {
    if (!state || !state.selectedQuestions) {
      console.error('State is corrupted, reinitializing...', state);
      return initialState;
    }

    switch (action.type) {
      case 'SELECT_SEAT':
        return {
          ...state,
          selectedSeat: action.payload,
          availableSeats: state.availableSeats.filter(seat => seat !== action.payload),
          currentScreen: 'questions'
        };
      
      case 'START_QUESTION':
        const startQuestionId = action.payload.id;
        const attempts = state.questionAttempts[startQuestionId] || 0;
        let newTimeLimit = 15; 

        if (action.payload.type === 'essay') {
          newTimeLimit = 90; // 1 phút 30 giây cho tự luận
        } else if (attempts > 0) {
          newTimeLimit = 10; // 10 giây cho lần thử lại trắc nghiệm
        }

        return {
          ...state,
          currentQuestion: action.payload,
          playerAttempts: 0,
          showResult: false,
          lastAnswer: null,
          timeLimit: newTimeLimit
        };
      
      case 'ANSWER_QUESTION':
        const newAttempts = state.playerAttempts + 1;
        const answerQuestionId = state.currentQuestion?.id || 0;
        const questionAttempts = state.questionAttempts[answerQuestionId] || 0;
        const isCorrect = action.payload.correct;

        let newState = {
            ...state,
            playerAttempts: newAttempts,
            lastAnswer: isCorrect ? 'correct' : 'incorrect' as ('correct' | 'incorrect'),
            showResult: isCorrect || newAttempts >= 2,
            questionAttempts: {
                ...state.questionAttempts,
                [answerQuestionId]: questionAttempts + 1
            }
        };
        
        // Đánh dấu câu hỏi trắc nghiệm đã hoàn thành nếu trả lời đúng
        if (isCorrect) {
            newState.selectedQuestions = [...state.selectedQuestions, answerQuestionId];
        }
        return newState;
      
      case 'RESET_QUESTION':
        return {
          ...state,
          playerAttempts: 0,
          showResult: false,
          lastAnswer: null,
          timeLimit: 10
        };
      
      case 'COMPLETE_QUESTION':
        // Dùng cho câu hỏi tự luận
        if (state.currentQuestion && !state.selectedQuestions.includes(state.currentQuestion.id)) {
          return {
            ...state,
            selectedQuestions: [...state.selectedQuestions, action.payload]
          };
        }
        return state;
      
      case 'SET_MAX_SEATS':
        return {
          ...state,
          maxSeats: action.payload,
          availableSeats: Array.from({ length: action.payload }, (_, i) => i + 1),
          selectedQuestions: state.selectedQuestions || []
        };
      
      case 'START_GAME':
        return {
          ...state,
          currentScreen: 'wheel'
        };
      
      case 'RETURN_TO_WHEEL':
        return {
          ...state,
          currentScreen: 'wheel',
          currentQuestion: null,
          playerAttempts: 0,
          showResult: false,
          lastAnswer: null,
          timeLimit: 15 
        };
      
      case 'SHOW_RESULT':
        return {
          ...state,
          showResult: action.payload
        };
      
      case 'RESET_ATTEMPTS':
        return {
          ...state,
          playerAttempts: 0,
          lastAnswer: null
        };
      
      default:
        return state;
    }
  };

  const GameContext = createContext<{
    state: GameState;
    dispatch: React.Dispatch<GameAction>;
  } | null>(null);

  export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, initialState);

    return (
      <GameContext.Provider value={{ state, dispatch }}>
        {children}
      </GameContext.Provider>
    );
  };

  export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
      throw new Error('useGame must be used within a GameProvider');
    }
    return context;
  };

  // --- II. COMPONENTS ---

  // Component hiển thị màn hình câu hỏi
  const QuestionScreen: React.FC = () => {
    const { state, dispatch } = useGame();
    const currentQuestion = state.currentQuestion;
    // Khởi tạo timeLeft từ state.timeLimit, đảm bảo nó cập nhật khi câu hỏi thay đổi
    const [timeLeft, setTimeLeft] = useState(state.timeLimit); 
    const [isCompletedLocally, setIsCompletedLocally] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [essayAnswer, setEssayAnswer] = useState(''); // State lưu câu trả lời tự luận
    
    const isEssay = currentQuestion?.type === 'essay';
    const isAnswered = state.showResult || (isEssay && isCompletedLocally); 
    const isButtonDisabled = isEssay && (isCompletedLocally || essayAnswer.trim().length === 0);

    // --- Logic Xử lý Hoàn thành (Dùng cho Tự luận) ---
    const handleComplete = useCallback(() => {
      if (!currentQuestion || isCompletedLocally || isEssay && essayAnswer.trim().length === 0) return;

      // 1. Đánh dấu đã hoàn thành cục bộ và gửi action hoàn thành câu hỏi
      setIsCompletedLocally(true);
      dispatch({ type: 'COMPLETE_QUESTION', payload: currentQuestion.id });
      dispatch({ type: 'SHOW_RESULT', payload: true }); // Hiển thị màn hình kết quả

      // 2. Tự động quay lại màn hình Wheel sau 3 giây
      setTimeout(() => {
        dispatch({ type: 'RETURN_TO_WHEEL' });
      }, 3000);
    }, [currentQuestion, isCompletedLocally, essayAnswer, isEssay, dispatch]);

    // --- Logic Timer ---
    useEffect(() => {
      // Reset trạng thái khi câu hỏi thay đổi
      setTimeLeft(state.timeLimit);
      setIsCompletedLocally(false);
      setSelectedOption(null);
      setEssayAnswer(''); // Reset câu trả lời tự luận

      if (!currentQuestion || isAnswered) return;

      const timer = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timer);
            if (isEssay) {
              // Tự động hoàn thành câu tự luận khi hết giờ (kể cả khi chưa nhập)
              handleComplete(); 
            } else {
              // Hết giờ cho trắc nghiệm -> đánh dấu thất bại
              dispatch({ type: 'SHOW_RESULT', payload: true }); 
              // Tự động quay lại wheel sau khi hiện kết quả
              setTimeout(() => dispatch({ type: 'RETURN_TO_WHEEL' }), 3000);
            }
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }, [currentQuestion, state.timeLimit, isAnswered, isEssay, handleComplete, dispatch]);
    
    // --- Logic Xử lý Trả lời Trắc nghiệm ---
    const handleAnswer = (index: number) => {
      if (state.showResult || state.playerAttempts >= 2) return;
      
      setSelectedOption(index);
      const isCorrect = index === currentQuestion!.correct;

      setTimeout(() => {
          dispatch({ type: 'ANSWER_QUESTION', payload: { correct: isCorrect } });
          
          // Nếu đã trả lời đúng, tự động quay lại vòng quay sau 3 giây
          if (isCorrect) {
              setTimeout(() => {
                  dispatch({ type: 'RETURN_TO_WHEEL' });
              }, 3000);
          }
          
      }, 300);
    };

    if (!currentQuestion) {
      return (
        <div className="text-center text-lg text-red-500">
          Không có câu hỏi nào được chọn.
        </div>
      );
    }
    
    // Hiển thị kết quả (Dùng chung cho cả 2 loại)
    if (state.showResult) {
        let resultMessage = "Đã hết thời gian!";
        let resultClass = "text-red-500";
        
        if (isEssay) {
            resultMessage = "CẢM ƠN. Câu trả lời của bạn đã được ghi nhận!";
            resultClass = "text-yellow-400";
        } else if (state.lastAnswer === 'correct') {
            resultMessage = "CHÍNH XÁC! Chúc mừng bạn!";
            resultClass = "text-green-400";
        } else if (state.playerAttempts >= 2 && state.lastAnswer === 'incorrect') {
            resultMessage = "HẾT LƯỢT. Rất tiếc, bạn đã hết 2 lần thử.";
            resultClass = "text-red-500";
        }

      return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-800/90 p-12 rounded-2xl shadow-2xl border-4 border-yellow-400/50 animate-fadeIn">
          <h2 className={`text-4xl font-extrabold ${resultClass} animate-pulse`}>
            {resultMessage}
          </h2>
          <p className="text-xl text-gray-300 mt-4 font-semibold">
              {isEssay ? "Bạn sẽ được chuyển về Vòng Quay để chọn người chơi tiếp theo." : `Đáp án đúng: ${currentQuestion.explanation}`}
          </p>
          <p className="text-sm text-gray-400 mt-6">
              (Tự động chuyển màn hình sau 3 giây)
          </p>
        </div>
      );
    }
    
    const formattedTime = `${Math.floor(timeLeft / 60)}:${('0' + (timeLeft % 60)).slice(-2)}`;


    // --- GIAO DIỆN CÂU HỎI TỰ LUẬN (ESSAY) ---
    if (isEssay) {
      return (
        <div className="w-full max-w-2xl mx-auto p-8 bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-yellow-500/30">
          <div className="text-center mb-6">
            <p className={`text-xl font-bold ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
              <span className="inline-block w-4 h-4 rounded-full bg-red-600 mr-2 animate-ping"></span>
              Thời gian còn lại: {formattedTime}
            </p>
            <h1 className="text-3xl font-extrabold text-white mt-4 leading-relaxed">{currentQuestion.question}</h1>
          </div>
          
          {/* Vùng nhập liệu */}
          <textarea
            className="w-full h-40 p-5 bg-gray-700 border-2 border-yellow-500/50 rounded-lg text-white resize-none text-lg focus:ring-4 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition duration-300 placeholder-gray-400"
            placeholder="Bạn hãy viết câu trả lời của mình vào đây (Tối thiểu 1 ký tự)..."
            value={essayAnswer}
            onChange={(e) => setEssayAnswer(e.target.value)}
            disabled={isCompletedLocally}
          />
          
          {/* Nút HOÀN THÀNH - ĐÚNG NHƯ YÊU CẦU */}
          <button 
            onClick={handleComplete}
            disabled={isButtonDisabled} // Vô hiệu hóa nếu chưa nhập gì hoặc đã hoàn thành
            className={`mt-6 w-full py-3 text-xl font-black text-gray-900 rounded-lg shadow-xl transition duration-300 hover:scale-[1.01] hover:shadow-2xl 
              ${isButtonDisabled 
                ? 'bg-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600'
              }`}
          >
            HOÀN THÀNH (Xác nhận)
          </button>
          <button 
            onClick={() => dispatch({ type: 'RETURN_TO_WHEEL' })}
            className="mt-3 w-full py-2 text-md font-semibold text-gray-400 border border-gray-700 rounded-lg transition hover:bg-gray-700/50"
          >
            ← Về Vòng Quay
          </button>
        </div>
      );
    }
    
    // --- GIAO DIỆN CÂU HỎI TRẮC NGHIỆM (MULTIPLE CHOICE) ---
    return (
      <div className="w-full max-w-3xl mx-auto p-8 bg-gray-800/95 rounded-2xl shadow-2xl border border-blue-500/30">
        <div className="text-center mb-6">
            <p className={`text-xl font-bold ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
              <span className="inline-block w-4 h-4 rounded-full bg-blue-600 mr-2 animate-ping"></span>
              Thời gian còn lại: {formattedTime}
            </p>
            <p className="text-md text-gray-400">Lượt thử: {state.playerAttempts + 1} / 2</p>
            <h1 className="text-3xl font-extrabold text-white mt-4 leading-relaxed">{currentQuestion.question}</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const isCorrectAnswer = index === currentQuestion.correct;
            
            let buttonClass = "bg-gray-700 hover:bg-gray-600 border-gray-600";
            let icon = null;

            if (state.showResult) {
              // Khi đã có kết quả
              if (isCorrectAnswer) {
                buttonClass = "bg-green-600 border-green-400 shadow-lg shadow-green-700/50";
                icon = <span className="ml-3 text-2xl">✅</span>;
              } else if (isSelected) {
                buttonClass = "bg-red-600 border-red-400 shadow-lg shadow-red-700/50 line-through opacity-70";
                icon = <span className="ml-3 text-2xl">❌</span>;
              }
            } else if (isSelected) {
                // Khi đang chọn nhưng chưa nộp
                buttonClass = "bg-blue-600 border-blue-400 ring-2 ring-blue-400";
            }
            
            return (
              <button 
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={state.showResult || state.playerAttempts >= 2}
                className={`p-4 text-left rounded-xl text-lg font-semibold border-2 transition-all duration-300 flex items-center justify-between ${buttonClass} disabled:cursor-not-allowed disabled:opacity-90`}
              >
                <span className="flex-grow">{option}</span>
                {icon}
              </button>
            );
          })}
        </div>
        
        {state.playerAttempts > 0 && state.lastAnswer === 'incorrect' && !state.showResult && (
            <p className="mt-4 text-center text-red-400 font-semibold text-lg animate-pulse">
                SAI! Bạn còn 1 lượt thử cuối. Hãy cẩn thận!
            </p>
        )}
      </div>
    );
  };


  // Component giả lập màn hình Wheel
  const WheelScreen: React.FC = () => {
      const { state, dispatch } = useGame();
      
      // Logic chọn ngẫu nhiên một câu hỏi chưa làm
      const startRandomQuestion = () => {
          const availableQuestions = state.questions.filter(
              q => !state.selectedQuestions.includes(q.id)
          );

          if (availableQuestions.length === 0) {
              console.log('Đã hoàn thành hết tất cả câu hỏi!');
              return;
          }

          const randomIndex = Math.floor(Math.random() * availableQuestions.length);
          const nextQuestion = availableQuestions[randomIndex];

          // Giả lập chọn ghế (Seat)
          const seat = state.availableSeats[Math.floor(Math.random() * state.availableSeats.length)];
          
          dispatch({ type: 'SELECT_SEAT', payload: seat });
          dispatch({ type: 'START_QUESTION', payload: nextQuestion });
      };

      return (
          <div className="text-center p-12 bg-gradient-to-br from-blue-900/80 to-indigo-900/80 rounded-2xl shadow-2xl border-4 border-blue-500/50">
              <h1 className="text-5xl font-black text-white mb-6 tracking-wider">
                  WILLPOWER GAME SHOW
              </h1>
              <p className="text-2xl text-yellow-300 mb-8 font-semibold">
                  Ghế được chọn: <span className="text-red-400 font-extrabold">{state.selectedSeat || 'N/A'}</span>
              </p>
              <div className="text-gray-300 mb-8 border-t border-b border-gray-700 py-3">
                  <p className="text-lg">
                      Tiến độ: <span className="font-bold text-green-400">{state.selectedQuestions.length}</span> / {state.questions.length} câu
                  </p>
                  <p className="text-sm mt-1">
                      Số ghế khả dụng: {state.availableSeats.length} / {state.maxSeats}
                  </p>
              </div>
              <button
                  onClick={startRandomQuestion}
                  className="px-10 py-4 text-2xl font-black text-white bg-gradient-to-r from-red-600 to-pink-600 rounded-full shadow-2xl transition duration-300 hover:from-red-700 hover:to-pink-700 transform hover:scale-105 animate-pulse-slow"
              >
                  <span className="relative z-10">QUAY VÀO GHẾ MAY MẮN</span>
                  <span className="absolute inset-0 rounded-full opacity-30 bg-white blur-sm"></span>
              </button>
          </div>
      );
  };

  // Component giả lập màn hình Setup
  const SetupScreen: React.FC = () => {
      const { dispatch } = useGame();
      const [maxSeatsInput, setMaxSeatsInput] = useState(60);

      const handleStart = () => {
          dispatch({ type: 'SET_MAX_SEATS', payload: maxSeatsInput });
          dispatch({ type: 'START_GAME' });
      };

      return (
          <div className="p-10 bg-gray-800 rounded-xl shadow-2xl border-t-4 border-yellow-500">
              <h1 className="text-3xl font-bold text-yellow-400 mb-6">THIẾT LẬP TRÒ CHƠI</h1>
              <label className="block mb-6 text-white text-lg font-medium">
                  Số lượng Ghế tham gia tối đa:
                  <input
                      type="number"
                      value={maxSeatsInput}
                      onChange={(e) => setMaxSeatsInput(parseInt(e.target.value) || 1)}
                      min="1"
                      className="mt-2 w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-yellow-500 focus:border-yellow-500"
                  />
              </label>
              <button
                  onClick={handleStart}
                  className="w-full py-3 bg-green-500 text-white font-bold text-xl rounded-lg hover:bg-green-600 transition shadow-lg"
              >
                  BẮT ĐẦU VÒNG QUAY
              </button>
          </div>
      );
  };


  // Component hiển thị nội dung chính của Game (Sau khi đã có Context)
  const MainGameContent = () => {
    const { state } = useGame();

    let ScreenComponent;
    switch (state.currentScreen) {
      case 'setup':
        ScreenComponent = SetupScreen;
        break;
      case 'wheel':
        ScreenComponent = WheelScreen;
        break;
      case 'questions':
        ScreenComponent = QuestionScreen;
        break;
      default:
        // Fallback
        ScreenComponent = SetupScreen;
    }

    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4 font-sans">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>{`
          /* Custom Keyframes for better animation */
          @keyframes pulse-slow {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.02); }
          }
          .animate-pulse-slow {
            animation: pulse-slow 3s infinite;
          }
          @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-20px); }
              to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
              animation: fadeIn 0.5s ease-out;
          }
        `}</style>
        <ScreenComponent />
      </div>
    );
  };


  // Component chính được export mặc định
  export default function App() {
      return (
          <GameProvider>
              <MainGameContent />
          </GameProvider>
      );
  }
