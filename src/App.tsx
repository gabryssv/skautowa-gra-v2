import { useState, useEffect } from 'react';
import { Riple } from 'react-loading-indicators';
import { useAuth } from './hooks/useAuth';
import { usePatrols } from './hooks/usePatrols.ts';
import type { Patrol, Level } from './types/game';
import type { Member } from './types/game';
import { PatrolProgress } from './components/PatrolProgress';
import { LevelCard } from './components/LevelCard';
import { PatrolLeaderPanel } from './components/PatrolLeaderPanel.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent } from './components/ui/card';
import { Shield, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import './index.css';

function App() {
  const { user, signIn, signOut, isLeader } = useAuth();
  const { patrols, loading, updateTask, addMember, removeMember, updateMemberTasks } = usePatrols();
  // null = strona główna, id = wybrany zastęp
  const [activePatrol, setActivePatrol] = useState<string | null>(null);
  const [isLeaderPanelOpen, setIsLeaderPanelOpen] = useState(false);
  const [lastLevelCompleted, setLastLevelCompleted] = useState<number | null>(null);

  // Po odświeżeniu zawsze strona główna
  useEffect(() => {
    setActivePatrol(null);
  }, []);

  // Check for level completion and trigger confetti
  useEffect(() => {
    const currentPatrol = patrols.find((p: Patrol) => p.id === activePatrol);
    if (currentPatrol && currentPatrol.currentLevel > 0) {
      if (lastLevelCompleted !== currentPatrol.currentLevel) {
        setLastLevelCompleted(currentPatrol.currentLevel);
        // Trigger confetti!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: [currentPatrol.color, '#ffd700', '#00ff00']
        });
      }
    }
  }, [patrols, activePatrol, lastLevelCompleted]);

  const currentPatrol = patrols.find((p: Patrol) => p.id === activePatrol);
  const canAccessLeaderPanel = user && currentPatrol && isLeader(currentPatrol.id);

  const handleLogin = async (password: string, rememberMe: boolean): Promise<boolean> => {
    if (!currentPatrol) return false;
    const result = await signIn(currentPatrol.id, password, rememberMe);
    return result;
  };

  const handleAddMember = (name: string) => {
    if (currentPatrol) {
      addMember(currentPatrol.id, name);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    if (currentPatrol) {
      removeMember(currentPatrol.id, memberId);
    }
  };

  const handleUpdateMemberTasks = (memberId: string, tasksStopien: number, tasksFunkcja: number) => {
    if (currentPatrol) {
      updateMemberTasks(currentPatrol.id, memberId, tasksStopien, tasksFunkcja);
    }
  };

  const handleUpdateTask = (levelIndex: number, taskId: string, newCurrent: number) => {
    if (currentPatrol) {
      updateTask(currentPatrol.id, levelIndex, taskId, newCurrent);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f1e] flex items-center justify-center">
        <div className="text-center">
          <Riple color="#d9d9d9" size="medium" text="" textColor="" />
          <p className="text-[#00ff00] text-sm animate-pulse">ŁADOWANIE...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f1e] p-6 md:p-12">
      {/* Pixel Art Header */}
      <div className="text-center mb-12">
        <div className="inline-block p-6 bg-gradient-to-b from-[#1a1a2e] to-[#16213e] border-4 border-[#4ecdc4] relative"
          style={{ boxShadow: '0 8px 0 #2a8c83, 0 12px 0 rgba(0,0,0,0.5)' }}>
          <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#ffd700] border-2 border-black" />
          <div className="absolute -top-3 -right-3 w-6 h-6 bg-[#ffd700] border-2 border-black" />
          <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-[#ffd700] border-2 border-black" />
          <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-[#ffd700] border-2 border-black" />
          <div className="flex items-center justify-center gap-4">
            <Shield className="w-8 h-8 text-[#4ecdc4]" />
            <h1 className="text-4xl md:text-5xl text-white tracking-wider"
              style={{ textShadow: '4px 4px 0 #000, 6px 6px 0 rgba(0,0,0,0.5)' }}>
              SKAUTOWA GRA
            </h1>
            <Shield className="w-8 h-8 text-[#4ecdc4]" />
          </div>
        </div>
      </div>

      {/* Pasek wyboru zastępu */}
      <div className="w-full max-w-6xl mx-auto mb-8">
        <div className="grid w-full bg-black/50 border-4 border-gray-700 mb-6 h-auto p-1"
          style={{ gridTemplateColumns: `repeat(${patrols.length || 1}, 1fr)` }}>
          {patrols.map((patrol) => (
            <button
              key={patrol.id}
              className={`py-3 transition-all rounded ${activePatrol === patrol.id ? 'text-white' : ''}`}
              style={{
                backgroundColor: activePatrol === patrol.id ? patrol.color : 'transparent',
                boxShadow: activePatrol === patrol.id ? `0 4px 0 ${patrol.color}80` : 'none'
              }}
              onClick={() => setActivePatrol(patrol.id)}
            >
              <div className="flex items-center gap-2 justify-center">
                <span>{patrol.name.includes('Wilk') ? '🐺' : '🦩'}</span>
                <span className="hidden sm:inline">{patrol.name}</span>
                {patrol.currentLevel > 0 && (
                  <span className="text-xs bg-black/30 px-2 py-0.5 rounded">
                    LVL {patrol.currentLevel}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Widok główny: statystyki i porównania */}
      {!activePatrol && (
        <div className="w-full max-w-4xl mx-auto bg-black/40 border-4 border-[#4ecdc4] p-8 rounded-xl mb-12">
          <h2 className="text-2xl text-white mb-6 text-center">Statystyki ogólne i porównanie zastępów</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {patrols.map((patrol) => {
              const totalZbiorki = patrol.levels.reduce((sum, lvl) => {
                const zbTask = lvl.tasks.find(t => t.name.toLowerCase().includes('zbiórki'));
                return sum + (zbTask ? zbTask.current : 0);
              }, 0);
              const totalTasks = patrol.members.reduce((sum, m) => sum + m.tasksStopien + m.tasksFunkcja, 0);
              return (
                <div key={patrol.id} className="bg-[#1a1a2e] border-2 border-gray-700 rounded-lg p-6 flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{patrol.name.includes('Wilk') ? '🐺' : '🦩'}</span>
                    <span className="text-lg text-white">{patrol.name}</span>
                  </div>
                  <div className="text-[#00ff00] text-3xl font-bold mb-2">{totalTasks}</div>
                  <div className="text-gray-300 text-sm mb-1">Zadań zaliczonych (łącznie)</div>
                  <div className="text-[#ffd700] text-xl font-bold mb-2">{totalZbiorki}</div>
                  <div className="text-gray-300 text-sm">Zbiórek przeprowadzonych</div>
                </div>
              );
            })}
          </div>
          {/* Top 5 członków wszystkich zastępów */}
          <div className="mt-12">
            <h3 className="text-lg text-white mb-4 text-center">Top 5 członków (wszystkie zastępy)</h3>
            <div className="space-y-2">
              {patrols
                .flatMap(patrol => patrol.members.map(m => ({
                  ...m,
                  patrolName: patrol.name,
                  totalTasks: m.tasksStopien + m.tasksFunkcja,
                  patrolColor: patrol.color
                })))
                .sort((a, b) => b.totalTasks - a.totalTasks)
                .slice(0, 5)
                .map((member, idx) => (
                  <div key={member.id} className="flex items-center gap-4 p-3 border-2 border-gray-700 bg-black/30 rounded">
                    <span className="text-gray-400 text-sm w-8">{idx + 1}.</span>
                    <span className="text-white text-sm flex-1 truncate">{member.name} <span className="ml-2 text-xs" style={{ color: member.patrolColor }}>{member.patrolName}</span></span>
                    <span className="text-gray-400 text-sm">ST: {member.tasksStopien}</span>
                    <span className="text-gray-400 text-sm">FN: {member.tasksFunkcja}</span>
                    <span className="text-[#00ff00] text-sm font-bold w-12 text-right">{member.totalTasks}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Widok zastępu */}
      {activePatrol && currentPatrol && (
        <>
          <PatrolProgress 
            patrol={currentPatrol} 
            onOpenLeaderPanel={() => setIsLeaderPanelOpen(true)} 
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
            {currentPatrol.levels.map((level: Level) => (
              <LevelCard 
                key={level.level} 
                level={level} 
                patrolColor={currentPatrol.color}
                allLevels={currentPatrol.levels}
              />
            ))}
          </div>
          {/* Members Leaderboard */}
          {currentPatrol.members.length > 0 && (
            <Card className="border-4 border-[#ffd700] mt-10" style={{ boxShadow: '0 4px 0 #b8860b' }}>
              <CardContent className="py-6">
                <div className="flex items-center gap-3 mb-6">
                  <Trophy className="w-6 h-6 text-[#ffd700]" />
                  <h3 className="text-white text-lg">TABLICA WYNIKÓW</h3>
                </div>
                {(() => {
                  const sorted = currentPatrol.members
                    .map((member: Member) => ({
                      ...member,
                      totalTasks: member.tasksStopien + member.tasksFunkcja
                    }))
                    .sort((a: Member & { totalTasks: number }, b: Member & { totalTasks: number }) => b.totalTasks - a.totalTasks);
                  const first = sorted[0];
                  const second = sorted[1];
                  const third = sorted[2];
                  const rest = sorted.slice(3);
                  return (
                    <>
                      {/* Podium */}
                      <div className="flex flex-col md:flex-row md:items-end justify-center gap-4 md:gap-8 mb-8">
                        {first && (
                          <div className="flex flex-col items-center w-full md:flex-1 md:max-w-sm md:order-2">
                            <div 
                              className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center border-4 border-[#ffd700] text-white text-2xl md:text-3xl mb-2"
                              style={{ backgroundColor: currentPatrol.color }}
                            >
                              {first.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-5xl md:text-6xl mb-2">🥇</div>
                            <div 
                              className="w-full p-4 border-4 border-[#ffd700] bg-[#ffd700]/20 text-center flex flex-col justify-center md:h-[180px]"
                            >
                              <p className="text-white text-base md:text-lg truncate">{first.name}</p>
                              <p className="text-gray-300 text-xs">ŁĄCZNIE</p>
                              <p className="text-[#00ff00] text-2xl md:text-3xl font-bold">{first.totalTasks}</p>
                              <div className="flex justify-center gap-4 mt-2">
                                <span className="text-gray-400 text-sm">ST: {first.tasksStopien}</span>
                                <span className="text-gray-400 text-sm">FN: {first.tasksFunkcja}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        {second && (
                          <div className="flex flex-col items-center w-full md:flex-1 md:max-w-xs md:order-1">
                            <div 
                              className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center border-4 border-[#c0c0c0] text-white text-xl md:text-2xl mb-2"
                              style={{ backgroundColor: currentPatrol.color }}
                            >
                              {second.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-4xl md:text-5xl mb-2">🥈</div>
                            <div 
                              className="w-full p-4 border-4 border-[#c0c0c0] bg-[#c0c0c0]/20 text-center flex flex-col justify-center md:h-[140px]"
                            >
                              <p className="text-white text-sm md:text-base truncate">{second.name}</p>
                              <p className="text-gray-300 text-xs">ŁĄCZNIE</p>
                              <p className="text-[#00ff00] text-xl md:text-2xl font-bold">{second.totalTasks}</p>
                              <div className="flex justify-center gap-4 mt-2">
                                <span className="text-gray-400 text-xs">ST: {second.tasksStopien}</span>
                                <span className="text-gray-400 text-xs">FN: {second.tasksFunkcja}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        {third && (
                          <div className="flex flex-col items-center w-full md:flex-1 md:max-w-xs md:order-3">
                            <div 
                              className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center border-4 border-[#cd7f32] text-white text-lg md:text-xl mb-2"
                              style={{ backgroundColor: currentPatrol.color }}
                            >
                              {third.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-3xl md:text-4xl mb-2">🥉</div>
                            <div 
                              className="w-full p-4 border-4 border-[#cd7f32] bg-[#cd7f32]/20 text-center flex flex-col justify-center md:h-[110px]"
                            >
                              <p className="text-white text-sm md:text-base truncate">{third.name}</p>
                              <p className="text-gray-300 text-xs">ŁĄCZNIE</p>
                              <p className="text-[#00ff00] text-lg md:text-xl font-bold">{third.totalTasks}</p>
                              <div className="flex justify-center gap-4 mt-2">
                                <span className="text-gray-400 text-xs">ST: {third.tasksStopien}</span>
                                <span className="text-gray-400 text-xs">FN: {third.tasksFunkcja}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      {rest.length > 0 && (
                        <div className="space-y-2">
                          {rest.map((member: Patrol['members'][number], idx: number) => (
                            <div 
                              key={member.id}
                              className="flex items-center gap-4 p-3 border-2 border-gray-700 bg-black/30"
                            >
                              <span className="text-gray-400 text-sm w-8">{idx + 4}.</span>
                              <span className="text-white text-sm flex-1 truncate">{member.name}</span>
                              <span className="text-gray-400 text-sm">ST: {member.tasksStopien}</span>
                              <span className="text-gray-400 text-sm">FN: {member.tasksFunkcja}</span>
                              <span className="text-[#00ff00] text-sm font-bold w-12 text-right">{(member as Member & { totalTasks: number }).totalTasks}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Leader Panel Dialog */}
      <PatrolLeaderPanel
        isOpen={isLeaderPanelOpen}
        onClose={() => setIsLeaderPanelOpen(false)}
        patrol={currentPatrol || null}
        isAuthenticated={!!canAccessLeaderPanel}
        onLogin={handleLogin}
        onLogout={signOut}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
        onUpdateMemberTasks={handleUpdateMemberTasks}
        onUpdateTask={handleUpdateTask}
      />

      {/* Footer */}
      <footer className="mt-16 text-center text-gray-500 text-xs">
        <p>Autor: Gabriel Kossakowski</p>
      </footer>
    </div>
  );
}

export default App
