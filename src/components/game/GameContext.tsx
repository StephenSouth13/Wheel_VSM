import React, { createContext, useContext, useReducer, ReactNode, useState, useEffect, useCallback } from 'react';

// --- I. TYPES AND DATA ---

export interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  type?: string; // Bổ sung type: 'special' cho câu hỏi đặc biệt
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
  // Câu 8: Đã chuyển thành trắc nghiệm
  {
    id: 8,
    question: 'Một thói quen nhỏ nào bạn nên duy trì mỗi ngày để rèn luyện sự bền bỉ?',
    options: ['Ngủ nướng đến trưa', 'Hoàn thành 1 task nhỏ mỗi ngày', 'Ăn uống theo cảm xúc', 'Trì hoãn mọi việc'], 
    correct: 1, 
    explanation: 'Hoàn thành một task nhỏ mỗi ngày giúp xây dựng thói quen kỷ luật và bền bỉ.',
  },
  // Câu 9: Đã chuyển thành trắc nghiệm
  {
    id: 9,
    question: 'Câu nói nào sau đây thể hiện tinh thần "Willpower Generation" tốt nhất?',
    options: ['"Muộn còn hơn không"', '"Hành động nhỏ tạo nên thay đổi lớn"', '"Chỉ cần tài năng bẩm sinh"', '"Chờ đợi cơ hội lớn"'],
    correct: 1,
    explanation: 'Ý chí bền bỉ được xây dựng từ những hành động nhỏ và kiên trì mỗi ngày.',
  },
  // Câu 10: Câu hỏi Đặc biệt (Special Question)
  {
    id: 10,
    question: 'KHI ĐỐI MẶT VỚI THẤT BẠI, BẠN NÊN LÀM GÌ ĐỂ LẤY LẠI TINH THẦN VÀ BƯỚC TIẾP?',
    options: ['Bỏ cuộc ngay lập tức', 'Đổ lỗi cho hoàn cảnh', 'Phân tích thất bại và rút ra bài học', 'Giả vờ như không có chuyện gì'],
    correct: 2,
    explanation: 'Cách tốt nhất là đối diện, phân tích nguyên nhân và biến thất bại thành kinh nghiệm quý báu.',
  
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
  timeLimit: 15, // Thời gian mặc định
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
      let newTimeLimit = 15; // Mặc định 15 giây

      // Logic cho Câu hỏi Đặc biệt (ID 10)
      if (action.payload.type === 'special') {
        newTimeLimit = 30; // 30 giây cho câu đặc biệt
      } else if (attempts > 0) {
        newTimeLimit = 10; // 10 giây cho lần thử lại trắc nghiệm
      }

      return {
        ...state,
        currentQuestion: action.payload,
        playerAttempts: 0,
        showResult: false,
        lastAnswer: null,
        timeLimit: newTimeLimit // Sử dụng timeLimit mới
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
          // Kết thúc lượt chơi nếu đúng hoặc đã hết 2 lần thử
          showResult: isCorrect || newAttempts >= 2, 
          questionAttempts: {
              ...state.questionAttempts,
              [answerQuestionId]: questionAttempts + 1
          }
      };
      
      // Đánh dấu câu hỏi đã hoàn thành nếu trả lời đúng
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
    
    // Đã loại bỏ action 'COMPLETE_QUESTION' vì không còn câu tự luận
    
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
  const [timeLeft, setTimeLeft] = useState(state.timeLimit);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  
  // Chỉ còn trắc nghiệm, nên isAnswered dựa trên showResult
  const isAnswered = state.showResult; 
  const isSpecial = currentQuestion?.type === 'special';


  // --- Logic Timer ---
  useEffect(() => {
    // Reset trạng thái khi câu hỏi thay đổi
    setTimeLeft(state.timeLimit);
    setSelectedOption(null);

    if (!currentQuestion || isAnswered) return;

    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          // Hết giờ -> đánh dấu thất bại
          dispatch({ type: 'SHOW_RESULT', payload: true }); 
          // Tự động quay lại wheel sau khi hiện kết quả
          setTimeout(() => dispatch({ type: 'RETURN_TO_WHEEL' }), 3000);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, state.timeLimit, isAnswered, dispatch]);
  
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
  
  // Hiển thị kết quả
  if (state.showResult) {
      let resultMessage = "Đã hết thời gian!";
      let resultClass = "text-red-500";
      
      if (state.lastAnswer === 'correct') {
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
            Đáp án đúng: {currentQuestion.explanation}
        </p>
        <p className="text-sm text-gray-400 mt-6">
            (Tự động chuyển màn hình sau 3 giây)
        </p>
      </div>
    );
  }
  
  const formattedTime = `${Math.floor(timeLeft / 60)}:${('0' + (timeLeft % 60)).slice(-2)}`;
  const timeClass = timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-blue-400';
  const headerText = isSpecial ? 'CÂU HỎI ĐẶC BIỆT' : 'CÂU HỎI';
  const headerColor = isSpecial ? 'text-yellow-400' : 'text-blue-400';


  // GIAO DIỆN CÂU HỎI TRẮC NGHIỆM
  return (
    <div className="w-full max-w-3xl mx-auto p-8 bg-gray-800/95 rounded-2xl shadow-2xl border border-blue-500/30">
      
      <div className="flex justify-between items-center mb-6">
        <button 
            onClick={() => dispatch({ type: 'RETURN_TO_WHEEL' })}
            className="flex items-center text-gray-400 hover:text-white transition duration-200"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Về Vòng Quay
        </button>
        <p className="text-md text-gray-400 font-semibold">Lượt thử: {state.playerAttempts + 1} / 2</p>
      </div>

      <div className="text-center mb-6 border-b border-gray-700 pb-4">
          <p className={`text-xl font-bold ${timeClass}`}>
             <span className="inline-block w-4 h-4 rounded-full bg-blue-600 mr-2 animate-ping"></span>
             Thời gian còn lại: {formattedTime}
          </p>
          <h2 className={`text-xl font-extrabold uppercase mt-2 ${headerColor}`}>{headerText}</h2>
          <h1 className="text-3xl font-extrabold text-white mt-2 leading-relaxed">{currentQuestion.question}</h1>
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
              buttonClass = "bg-red-600 border-red-400 shadow-lg shadow-red-700/50 opacity-70";
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
