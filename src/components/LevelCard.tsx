import type { Level } from "../types/game";
import { getIncrementalProgress } from "../types/game";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Lock } from "lucide-react";
import { Badge } from "./ui/badge";

interface LevelCardProps {
  level: Level;
  patrolColor: string;
  allLevels: Level[];
}

export function LevelCard({ level, patrolColor, allLevels }: LevelCardProps) {
  const completedTasks = level.tasks.filter(t => t.completed).length;
  const totalTasks = level.tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const levelIndex = allLevels.findIndex(l => l.level === level.level);

  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-300 border-4 ${
        level.isCompleted ? 'animate-pulse' : !level.isUnlocked ? 'opacity-60' : ''
      }`}
      style={{
        borderColor: level.isCompleted || level.isUnlocked ? patrolColor : '#333',
        boxShadow: level.isCompleted || level.isUnlocked 
          ? `0 4px 0 ${patrolColor}, 0 8px 0 rgba(0,0,0,0.5)` 
          : '0 4px 0 #333, 0 8px 0 rgba(0,0,0,0.5)'
      }}
    >
      <div 
        className="absolute top-0 right-0 px-3 py-2 text-xs flex items-center justify-center z-20"
        style={{ backgroundColor: patrolColor }}
      >
        LVL {level.level}
      </div>

      {!level.isUnlocked && (
        <div className="absolute inset-0 bg-[#0f0f1e]/90 flex items-center justify-center z-10">
          <div className="text-center">
            <Lock className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p className="text-[#ff6b6b] text-xs">🔒 LOCKED</p>
          </div>
        </div>
      )}

      {level.isCompleted && (
        <div 
          className="absolute inset-0 pointer-events-none border-4 border-[#ffd700]"
          style={{
            background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,215,0,0.1) 10px, rgba(255,215,0,0.1) 20px)'
          }}
        />
      )}

      <CardHeader className="py-5">
        <CardTitle className="text-white pr-20">
          {level.name}
          {level.isCompleted && (
            <Badge className="bg-[#ffd700] text-black border-2 border-black text-xs ml-2">
              ★ DONE!
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 py-5">
        <div className="space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-[#00ff00]">▶ PROGRESS</span>
            <span className="text-white">{completedTasks}/{totalTasks}</span>
          </div>
          <div className="h-4 bg-black border-2 border-gray-600 relative overflow-hidden">
            <div 
              className="h-full transition-all duration-500"
              style={{ 
                width: `${progress}%`,
                backgroundColor: patrolColor,
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,0,0,0.2) 4px, rgba(0,0,0,0.2) 8px)'
              }}
            />
          </div>
        </div>

        <div className="space-y-3">
          {level.tasks.map((task) => {
            const incremental = getIncrementalProgress(task, allLevels, levelIndex);
            
            return (
              <div 
                key={task.id} 
                className={`p-3 border-2 ${task.completed ? 'border-[#00ff00]/30 bg-[#00ff00]/5' : 'border-gray-700 bg-black/30'}`}
              >
                <div>
                  <span 
                    className={`float-right ml-3 text-[9px] ${task.completed ? 'text-[#00ff00]' : 'text-gray-400'}`}
                  >
                    {incremental.current}/{incremental.target}
                  </span>
                  <span className={`text-[10px] leading-relaxed ${task.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                    {task.completed && <span className="text-[#00ff00] mr-2">✓</span>}
                    {task.name}
                  </span>
                </div>
                {!task.completed && incremental.target > 1 && (
                  <div className="h-2 bg-black border border-gray-600 mt-2 relative overflow-hidden">
                    <div 
                      className="h-full transition-all duration-300"
                      style={{ 
                        width: `${(incremental.current / incremental.target) * 100}%`,
                        backgroundColor: patrolColor
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
