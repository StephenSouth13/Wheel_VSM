import React, { useState } from 'react';
import { useGame } from './GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, Users, Save } from 'lucide-react';

export const SeatConfig: React.FC = () => {
  const { state, dispatch } = useGame();
  const [tempMaxSeats, setTempMaxSeats] = useState(state.maxSeats);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const handleSaveConfig = () => {
    const newMaxSeats = Math.min(Math.max(tempMaxSeats, 10), 100); // Min 10, Max 100
    dispatch({ type: 'SET_MAX_SEATS', payload: newMaxSeats });
    setIsConfigOpen(false);
  };

  if (state.currentScreen !== 'wheel') return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      {!isConfigOpen ? (
        <Button
          onClick={() => setIsConfigOpen(true)}
          className="bg-game-blue hover:bg-game-blue/90 text-white rounded-full p-3 neumorphism hover:scale-110 transition-all duration-300"
        >
          <Settings className="w-5 h-5" />
        </Button>
      ) : (
        <div className="glassmorphism rounded-2xl p-6 min-w-[280px] fade-in">
          <div className="flex items-center mb-4">
            <Users className="w-5 h-5 text-game-gold mr-2" />
            <h3 className="text-lg font-bold text-game-white">Cài đặt ghế</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Số ghế tối đa (10-100):
              </label>
              <Input
                type="number"
                min={10}
                max={100}
                value={tempMaxSeats}
                onChange={(e) => setTempMaxSeats(parseInt(e.target.value) || 10)}
                className="bg-card border-border"
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              Hiện tại: <span className="text-game-gold font-bold">{state.availableSeats.length}</span> ghế còn lại
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleSaveConfig}
                className="flex-1 bg-game-gold hover:bg-game-gold/90 text-white font-bold"
              >
                <Save className="w-4 h-4 mr-2" />
                Lưu
              </Button>
              <Button
                onClick={() => setIsConfigOpen(false)}
                variant="outline"
                className="flex-1"
              >
                Hủy
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};