import React, { useState } from 'react';
import { useGame } from './GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Settings, Users } from 'lucide-react';

export const GameSetup: React.FC = () => {
  const { state, dispatch } = useGame();
  const [tempMaxSeats, setTempMaxSeats] = useState(state.maxSeats);

  if (state.currentScreen !== 'setup') return null;

  const handleStartGame = () => {
    if (tempMaxSeats !== state.maxSeats) {
      dispatch({ type: 'SET_MAX_SEATS', payload: tempMaxSeats });
    }
    dispatch({ type: 'START_GAME' });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 p-8">
      {/* Setup Card */}
      <div className="glassmorphism rounded-3xl p-8 max-w-md w-full space-y-6 floating">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-game-gold to-game-gold/80 rounded-full flex items-center justify-center mx-auto glow">
            <Settings className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-game-white">
            Thiết Lập Game
          </h2>
          <p className="text-muted-foreground">
            Cấu hình số lượng ghế trước khi bắt đầu
          </p>
        </div>

        {/* Seat Configuration */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxSeats" className="text-game-white font-semibold flex items-center gap-2">
              <Users className="w-4 h-4" />
              Số lượng ghế tối đa
            </Label>
            <Input
              id="maxSeats"
              type="number"
              min="10"
              max="100"
              value={tempMaxSeats}
              onChange={(e) => setTempMaxSeats(parseInt(e.target.value) || 60)}
              className="bg-white/10 border-white/20 text-game-white text-center text-lg font-bold"
            />
          </div>

          <div className="bg-white/5 rounded-xl p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Thông tin cấu hình:
            </p>
            <div className="flex justify-between">
              <span className="text-game-white">Số ghế:</span>
              <span className="text-game-gold font-bold">{tempMaxSeats}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-game-white">Câu hỏi:</span>
              <span className="text-game-gold font-bold">10</span>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <Button
          onClick={handleStartGame}
          size="lg"
          className="w-full py-4 text-xl font-bold bg-gradient-to-r from-game-gold to-game-gold/80 hover:from-game-gold/90 hover:to-game-gold/70 text-white rounded-2xl neumorphism pulse-glow hover:scale-105 transition-all duration-300"
        >
          <Play className="mr-2 h-6 w-6" />
          Bắt Đầu Game
        </Button>
      </div>

      {/* Instructions */}
      <div className="glassmorphism rounded-2xl p-6 max-w-lg w-full space-y-4 bounce-in">
        <h3 className="text-xl font-bold text-game-gold text-center">
          🎯 Hướng Dẫn Chơi
        </h3>
        <div className="space-y-2 text-game-white">
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 bg-game-gold rounded-full"></span>
            Quay vòng để chọn người chơi
          </p>
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 bg-game-gold rounded-full"></span>
            Trả lời câu hỏi trong thời gian cho phép
          </p>
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 bg-game-gold rounded-full"></span>
            Tối đa 1 lần reset cho mỗi câu hỏi
          </p>
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 bg-game-gold rounded-full"></span>
            Thời gian giảm còn 10s khi reset
          </p>
        </div>
      </div>
    </div>
  );
};