import React, { useState } from 'react';
import { SpinningWheel } from '@/components/game/SpinningWheel';
import { QuestionBoard } from '@/components/game/QuestionBoard';
import { GameSetup } from '@/components/game/GameSetup';
import { GameProvider } from '@/components/game/GameContext';
import { ParticleBackground } from '@/components/game/ParticleBackground';
import gameBackground from '@/assets/game-background.jpg';

const Index = () => {
  return (
    <GameProvider>
      <div 
        className="min-h-screen bg-background relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(34, 40, 49, 0.85), rgba(34, 40, 49, 0.85)), url(${gameBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <ParticleBackground />
        
        {/* Header */}
        <header className="relative z-10 text-center py-8">
          <h1 className="text-6xl font-bold text-game-white mb-2 drop-shadow-lg">
            Chạy Bộ Với Trái Tim
          </h1>
          <p className="text-xl text-muted-foreground font-['Montserrat',sans-serif]">
            Talkshow Mini Game - Vòng Quay May Mắn
          </p>
        </header>

        {/* Main Game Area */}
        <main className="relative z-10 container mx-auto px-4">
          <div className="flex flex-col items-center justify-center">
            <GameSetup />
            <SpinningWheel />
            <QuestionBoard />
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 text-center py-4 text-muted-foreground">
          <p className="font-['Montserrat',sans-serif]">
            © 2024 Chạy Bộ Với Trái Tim Talkshow
          </p>
        </footer>
      </div>
    </GameProvider>
  );
};

export default Index;