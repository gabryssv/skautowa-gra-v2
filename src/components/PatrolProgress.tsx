import type { Patrol } from "../types/game";
import { Trophy, Users } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

interface PatrolProgressProps {
  patrol: Patrol;
  onOpenLeaderPanel: () => void;
  hideActions?: boolean;
}

export function PatrolProgress({ patrol, onOpenLeaderPanel, hideActions }: PatrolProgressProps) {
  const totalLevels = patrol.levels.length;
  const completedLevels = patrol.levels.filter(l => l.isCompleted).length;
  
  const workingOnLevelIndex = patrol.levels.findIndex(l => !l.isCompleted);
  const workingOnLevelData = workingOnLevelIndex >= 0 ? patrol.levels[workingOnLevelIndex] : null;

  return (
    <Card className="overflow-hidden border-4" style={{
      borderColor: patrol.color,
      boxShadow: `0 4px 0 ${patrol.color}, 0 8px 0 rgba(0,0,0,0.5)`
    }}>
      <div 
        className="h-2 transition-all duration-500 relative"
        style={{ backgroundColor: '#0f0f1e' }}
      >
        <div 
          className="h-full"
          style={{
            width: `${(completedLevels / totalLevels) * 100}%`,
            backgroundColor: patrol.color,
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,0,0,0.3) 4px, rgba(0,0,0,0.3) 8px)'
          }}
        />
      </div>
      <CardContent className="py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-6">
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 flex items-center justify-center border-4 border-black text-2xl"
              style={{ backgroundColor: patrol.color }}
            >
              {patrol.name.includes('Wilk') ? '🐺' : '🦩'}
            </div>
            <div>
              <h2 className="text-white" style={{ textShadow: '3px 3px 0 rgba(0,0,0,0.5)' }}>
                {patrol.name.toUpperCase()}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <Trophy className="w-6 h-6 text-[#ffd700]" />
                <span className="text-[#ffd700] text-xl" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.5)' }}>
                  {patrol.currentLevel === 0 ? 'BRAK POZIOMU' : `POZIOM ${patrol.currentLevel}`}
                </span>
              </div>
              <p className="text-white text-xs">
                {completedLevels}/{totalLevels} POZIOMÓW OK
              </p>
            </div>

            {!hideActions && (
              <Button
                onClick={onOpenLeaderPanel}
                className="bg-[#4ecdc4] hover:bg-[#3ab8ae] text-black border-4 border-[#2a8c83]"
                style={{ boxShadow: '0 4px 0 #2a8c83' }}
              >
                <Users className="w-4 h-4 mr-2" />
                PANEL ZASTĘPOWEGO
              </Button>
            )}
          </div>
        </div>

        {patrol.currentLevel === 0 && (
          <div className="mt-6 p-5 bg-[#ff6b6b]/20 border-4 border-[#ff6b6b]">
            <p className="text-[#ff6b6b] text-center text-xs">
              ⚠️ ROZPOCZNIJCIE OD POZIOMU 1 - UKOŃCZCIE WSZYSTKIE ZADANIA ABY ZDOBYĆ POZIOM! ⚠️
            </p>
          </div>
        )}

        {patrol.currentLevel > 0 && patrol.currentLevel < totalLevels && workingOnLevelData && (
          <div className="mt-6 p-5 bg-[#ffd700] border-4 border-black">
            <p className="text-black text-center text-xs">
              🎉 POZIOM {patrol.currentLevel} UKOŃCZONY! PRACUJCIE NAD POZIOMEM {patrol.currentLevel + 1}! 🎉
            </p>
          </div>
        )}

        {patrol.currentLevel === totalLevels && !workingOnLevelData && (
          <div className="mt-6 p-5 bg-gradient-to-r from-[#ffd700] to-[#ffed4e] border-4 border-black">
            <p className="text-black text-center text-xs animate-pulse">
              👑 WSZYSTKIE POZIOMY UKOŃCZONE! JESTEŚCIE MISTRZAMI ZASTĘPU! 👑
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
