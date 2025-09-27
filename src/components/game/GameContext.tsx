import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface Question {
  id: number;  
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  type?: string; // Add this line
}

interface GameState {
  currentScreen: 'setup' | 'wheel' | 'questions';
  selectedSeat: number | null;
  availableSeats: number[];
  questions: Question[];
  selectedQuestions: number[];
  questionAttempts: Record<number, number>; // Track attempts per question ID
  currentQuestion: Question | null;
  playerAttempts: number;
  showResult: boolean;
  lastAnswer: 'correct' | 'incorrect' | null;
  timeLimit: number; // Dynamic time limit
  maxSeats: number; // Configurable seat limit
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
    question: 'Một thói quen nhỏ nào bạn đang duy trì mỗi ngày để rèn luyện sự bền bỉ? (Tự luận)',
    options: [], // Không có options cho câu hỏi tự luận
    correct: -1, // Giá trị đặc biệt để đánh dấu không có đáp án trắc nghiệm
    explanation: 'Câu trả lời tự luận, không có đáp án đúng/sai cụ thể.',
    type: 'essay' // Thêm thuộc tính này để phân biệt
  },
  {
    id: 9,
    question: 'Nếu phải chọn một câu nói truyền cảm hứng về ý chí để nhắc nhở bản thân, bạn sẽ chọn câu nào? (Tự luận)',
    options: [],
    correct: -1,
    explanation: 'Câu trả lời tự luận, không có đáp án đúng/sai cụ thể.',
    type: 'essay'
  },
  {
    id: 10,
    question: 'Khi đối mặt với thất bại, bạn thường làm gì để lấy lại tinh thần và bước tiếp? (Tự luận)',
    options: [],
    correct: -1,
    explanation: 'Câu trả lời tự luận, không có đáp án đúng/sai cụ thể.',
    type: 'essay'
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
      let newTimeLimit = 15; // Thời gian mặc định cho câu trắc nghiệm

      // Thiết lập thời gian đặc biệt cho câu hỏi tự luận và lần thử lại
      if (action.payload.type === 'essay') {
        newTimeLimit = 90; // 1 phút 30 giây
      } else if (attempts > 0) {
        newTimeLimit = 10; // 10 giây cho lần thử lại
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
      
      return {
        ...state,
        playerAttempts: newAttempts,
        lastAnswer: action.payload.correct ? 'correct' : 'incorrect',
        showResult: action.payload.correct || newAttempts >= 2,
        questionAttempts: {
          ...state.questionAttempts,
          [answerQuestionId]: questionAttempts + 1
        }
      };
    
    case 'RESET_QUESTION':
      return {
        ...state,
        playerAttempts: 0,
        showResult: false,
        lastAnswer: null,
        timeLimit: 10
      };
    
    case 'COMPLETE_QUESTION':
      return {
        ...state,
        selectedQuestions: [...(state.selectedQuestions || []), action.payload]
      };
    
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
        timeLimit: 15 // Đảm bảo thời gian được reset về mặc định
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