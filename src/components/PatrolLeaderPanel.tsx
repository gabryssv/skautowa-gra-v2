import { useState, useEffect, useRef } from "react";
import type { Patrol, Member } from "../types/game";
import { getIncrementalProgress } from "../types/game";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { 
  LogOut, 
  UserPlus, 
  Trash2, 
  Users, 
  ClipboardList,
  Lock,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface PatrolLeaderPanelProps {
  isOpen: boolean;
  onClose: () => void;
  patrol: Patrol | null;
  isAuthenticated: boolean;
  onLogin: (password: string, rememberMe: boolean) => Promise<boolean>;
  onLogout: () => void;
  onAddMember: (name: string) => void;
  onRemoveMember: (memberId: string) => void;
  onUpdateMemberTasks: (memberId: string, tasksStopien: number, tasksFunkcja: number) => void;
  onUpdateTask: (levelIndex: number, taskId: string, newCurrent: number) => void;
}

export function PatrolLeaderPanel({
  isOpen,
  onClose,
  patrol,
  isAuthenticated,
  onLogin,
  onLogout,
  onAddMember,
  onRemoveMember,
  onUpdateMemberTasks,
  onUpdateTask
}: PatrolLeaderPanelProps) {
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [newMemberName, setNewMemberName] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [editingMember, setEditingMember] = useState<{ stopien: string; funkcja: string } | null>(null);
  const [expandedLevels, setExpandedLevels] = useState<number[]>([0]); // First level expanded by default
  const holdIntervalRef = useRef<number | null>(null);
  const speedUpTimeoutRef = useRef<number | null>(null);

  const handleLogin = async () => {
    const success = await onLogin(password, rememberMe);
    if (success) {
      setPassword("");
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      onAddMember(newMemberName.trim());
      setNewMemberName("");
    }
  };

  const handleLogoutAndClose = () => {
    onLogout();
    setSelectedMember(null);
    onClose();
  };

  const handleSelectMember = (member: Member) => {
    if (selectedMember?.id === member.id) {
      setSelectedMember(null);
      setEditingMember(null);
    } else {
      setSelectedMember(member);
      setEditingMember({ 
        stopien: member.tasksStopien.toString(), 
        funkcja: member.tasksFunkcja.toString() 
      });
    }
  };

  const handleSaveMemberTasks = () => {
    if (selectedMember && editingMember) {
      const stopien = parseInt(editingMember.stopien) || 0;
      const funkcja = parseInt(editingMember.funkcja) || 0;
      onUpdateMemberTasks(selectedMember.id, Math.max(0, stopien), Math.max(0, funkcja));
      
      setSelectedMember({
        ...selectedMember,
        tasksStopien: Math.max(0, stopien),
        tasksFunkcja: Math.max(0, funkcja)
      });
    }
  };

  const toggleLevel = (levelIndex: number) => {
    setExpandedLevels(prev => 
      prev.includes(levelIndex) 
        ? prev.filter(i => i !== levelIndex)
        : [...prev, levelIndex]
    );
  };

  // Calculate total member tasks
  const totalMemberTasks = patrol?.members.reduce((sum, m) => sum + m.tasksStopien + m.tasksFunkcja, 0) ?? 0;

  // Task editing state - track changes per task
  const [taskEdits, setTaskEdits] = useState<Record<string, string>>({});

  // Sync task edits with patrol data
  useEffect(() => {
    if (patrol) {
      const edits: Record<string, string> = {};
      patrol.levels.forEach(level => {
        level.tasks.forEach(task => {
          // Don't override if task is t2 (calculated automatically)
          if (!task.id.includes('-t2')) {
            edits[task.id] = task.current.toString();
          }
        });
      });
      setTaskEdits(edits);
    }
  }, [patrol]);

  const handleTaskChange = (taskId: string, value: string) => {
    setTaskEdits(prev => ({ ...prev, [taskId]: value }));
  };

  const handleSaveTask = (levelIndex: number, taskId: string) => {
    const value = parseInt(taskEdits[taskId]) || 0;
    onUpdateTask(levelIndex, taskId, Math.max(0, value));
  };

  const incrementTask = (levelIndex: number, taskId: string, delta: number) => {
    setTaskEdits(prev => {
      const currentValue = parseInt(prev[taskId]) || 0;
      const newValue = Math.max(0, currentValue + delta);
      onUpdateTask(levelIndex, taskId, newValue);
      return { ...prev, [taskId]: newValue.toString() };
    });
  };

  const startHoldIncrement = (levelIndex: number, taskId: string, delta: number) => {
    incrementTask(levelIndex, taskId, delta);
    holdIntervalRef.current = setInterval(() => {
      incrementTask(levelIndex, taskId, delta);
    }, 300);
    
    // After 3 seconds, speed up the increment
    speedUpTimeoutRef.current = setTimeout(() => {
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
        holdIntervalRef.current = setInterval(() => {
          incrementTask(levelIndex, taskId, delta);
        }, 100);
      }
    }, 3000);
  };

  const stopHoldIncrement = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    if (speedUpTimeoutRef.current) {
      clearTimeout(speedUpTimeoutRef.current);
      speedUpTimeoutRef.current = null;
    }
  };

  const incrementMemberField = (field: 'stopien' | 'funkcja', delta: number) => {
    setEditingMember(prev => {
      if (!prev) return null;
      const currentValue = parseInt(prev[field]) || 0;
      const newValue = Math.max(0, currentValue + delta);
      return { ...prev, [field]: newValue.toString() };
    });
  };

  const startHoldMemberIncrement = (field: 'stopien' | 'funkcja', delta: number) => {
    incrementMemberField(field, delta);
    holdIntervalRef.current = setInterval(() => {
      incrementMemberField(field, delta);
    }, 300);
    
    // After 3 seconds, speed up the increment
    speedUpTimeoutRef.current = setTimeout(() => {
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
        holdIntervalRef.current = setInterval(() => {
          incrementMemberField(field, delta);
        }, 100);
      }
    }, 3000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-auto max-h-[calc(100vh-3rem)] flex flex-col overflow-hidden bg-[#1a1a2e] border-4 border-[#4ecdc4]">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-[#4ecdc4] flex items-center gap-2">
            <Users className="w-5 h-5" />
            PANEL ZASTĘPOWEGO
          </DialogTitle>
          <DialogDescription className="text-[#00ff00] text-xs">
            {patrol ? `▶ ${patrol.name.toUpperCase()}` : '▶ WYBIERZ ZASTĘP'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {!isAuthenticated ? (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-black/50 border-2 border-gray-700 text-center">
                <Lock className="w-12 h-12 mx-auto mb-4 text-[#ff6b6b]" />
                <p className="text-white text-sm">
                  WPROWADŹ HASŁO ZASTĘPOWEGO
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white text-xs">HASŁO:</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLoginError(false);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className={`bg-black/50 border-2 ${loginError ? 'border-[#ff6b6b]' : 'border-gray-600'} text-white`}
                  placeholder="••••••••"
                />
                {loginError && (
                  <p className="text-[#ff6b6b] text-xs">❌ BŁĘDNE HASŁO!</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox 
                  id="rememberMe" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  className="border-gray-600 data-[state=checked]:bg-[#4ecdc4] data-[state=checked]:border-[#4ecdc4]"
                />
                <Label htmlFor="rememberMe" className="text-white text-xs cursor-pointer">
                  ZAPAMIĘTAJ MNIE
                </Label>
              </div>

              <Button 
                onClick={handleLogin}
                className="w-full bg-[#4ecdc4] hover:bg-[#3ab8ae] text-black border-4 border-[#2a8c83]"
              >
                ZALOGUJ SIĘ
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <Tabs defaultValue="tasks" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-black/50 border-2 border-gray-700 h-auto">
                  <TabsTrigger value="tasks" className="data-[state=active]:bg-[#4ecdc4] data-[state=active]:text-black text-xs">
                    <ClipboardList className="w-3 h-3 mr-1" />
                    ZADANIA ZASTĘPU
                  </TabsTrigger>
                  <TabsTrigger value="members" className="data-[state=active]:bg-[#4ecdc4] data-[state=active]:text-black text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    CZŁONKOWIE
                  </TabsTrigger>
                </TabsList>

                {/* ZADANIA ZASTĘPU TAB */}
                <TabsContent value="tasks" className="space-y-3 mt-4">
                  {patrol?.levels.map((level, levelIndex) => (
                    <Card key={level.level} className="bg-black/30 border-2 border-gray-700">
                      <CardHeader 
                        className="p-3 cursor-pointer hover:bg-black/20 transition-colors"
                        onClick={() => toggleLevel(levelIndex)}
                      >
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <span className={`${level.isCompleted ? 'text-[#00ff00]' : level.isUnlocked ? 'text-[#ffd700]' : 'text-gray-500'}`}>
                              {level.isCompleted ? '✅' : level.isUnlocked ? '🔓' : '🔒'}
                            </span>
                            <span className={`${level.isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                              POZIOM {level.level}
                            </span>
                          </CardTitle>
                          {expandedLevels.includes(levelIndex) ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </CardHeader>
                      
                      {expandedLevels.includes(levelIndex) && (
                        <CardContent className="p-3 pt-0 space-y-2">
                          {level.tasks.map((task) => {
                            const isT2 = task.id.includes('-t2');
                            
                            // Dla t2 użyj inkrementalnego postępu
                            let displayCurrent: number;
                            let displayTarget: number;
                            let isCompleted: boolean;
                            
                            if (isT2 && patrol) {
                              // Stwórz task z totalMemberTasks jako current
                              const taskWithTotal = { ...task, current: totalMemberTasks };
                              const incremental = getIncrementalProgress(taskWithTotal, patrol.levels, levelIndex);
                              displayCurrent = incremental.current;
                              displayTarget = incremental.target;
                              isCompleted = displayCurrent >= displayTarget;
                            } else {
                              displayCurrent = parseInt(taskEdits[task.id]) || 0;
                              displayTarget = task.target;
                              isCompleted = displayCurrent >= displayTarget;
                            }
                            
                            return (
                              <div 
                                key={task.id}
                                className={`p-2 border-2 ${isCompleted ? 'border-[#00ff00] bg-[#00ff00]/10' : 'border-gray-700 bg-black/30'}`}
                              >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <p className={`text-xs flex-1 ${isCompleted ? 'text-[#00ff00]' : 'text-white'}`}>
                                    {isCompleted && '✓ '}{task.name}
                                  </p>
                                  <Badge className={`text-xs shrink-0 ${isCompleted ? 'bg-[#00ff00] text-black' : 'bg-gray-600 text-white'}`}>
                                    {displayCurrent}/{displayTarget}
                                  </Badge>
                                </div>
                                
                                {isT2 ? (
                                  <p className="text-gray-400 text-xs italic">
                                    (wartość aktualizuje się automatycznie na podstawie zadań członków)
                                  </p>
                                ) : (() => {
                                  const handleDecrement = (e: React.MouseEvent | React.TouchEvent) => {
                                    e.preventDefault();
                                    startHoldIncrement(levelIndex, task.id, -1);
                                  };
                                  const handleIncrement = (e: React.MouseEvent | React.TouchEvent) => {
                                    e.preventDefault();
                                    startHoldIncrement(levelIndex, task.id, 1);
                                  };
                                  const handleStop = (e: React.MouseEvent | React.TouchEvent) => {
                                    e.preventDefault();
                                    stopHoldIncrement();
                                  };
                                  
                                  return (
                                    <div className="flex items-center gap-3">
                                      <Button
                                        variant="outline"
                                        size="lg"
                                        onMouseDown={handleDecrement}
                                        onMouseUp={handleStop}
                                        onMouseLeave={handleStop}
                                        onTouchStart={handleDecrement}
                                        onTouchEnd={handleStop}
                                        className="border-gray-600 text-white hover:bg-gray-700 w-12 h-12 text-xl flex-shrink-0"
                                        disabled={!level.isUnlocked}
                                      >
                                        -
                                      </Button>
                                      <Input
                                        type="number"
                                        value={taskEdits[task.id] ?? '0'}
                                        onChange={(e) => handleTaskChange(task.id, e.target.value)}
                                        onBlur={() => handleSaveTask(levelIndex, task.id)}
                                        className="bg-black/50 border-2 border-gray-600 text-white text-center flex-1 h-12 text-lg"
                                        min="0"
                                        disabled={!level.isUnlocked}
                                      />
                                      <Button
                                        variant="outline"
                                        size="lg"
                                        onMouseDown={handleIncrement}
                                        onMouseUp={handleStop}
                                        onMouseLeave={handleStop}
                                        onTouchStart={handleIncrement}
                                        onTouchEnd={handleStop}
                                        className="border-gray-600 text-white hover:bg-gray-700 w-12 h-12 text-xl flex-shrink-0"
                                        disabled={!level.isUnlocked}
                                      >
                                        +
                                      </Button>
                                    </div>
                                  );
                                })()}
                              </div>
                            );
                          })}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </TabsContent>

                {/* CZŁONKOWIE TAB */}
                <TabsContent value="members" className="space-y-4 mt-4">
                  {/* Add member */}
                  <div className="flex gap-2">
                    <Input
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                      placeholder="IMIĘ NOWEGO CZŁONKA"
                      className="bg-black/50 border-2 border-gray-600 text-white flex-1"
                    />
                    <Button 
                      onClick={handleAddMember}
                      className="bg-[#00ff00] hover:bg-[#00cc00] text-black border-2 border-[#009900]"
                      disabled={!newMemberName.trim()}
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Members list */}
                  <div className="space-y-2">
                    {patrol?.members.map((member) => {
                      const memberTotal = member.tasksStopien + member.tasksFunkcja;
                      const isSelected = selectedMember?.id === member.id;
                      
                      return (
                        <Card 
                          key={member.id} 
                          className={`bg-black/30 border-2 transition-all ${
                            isSelected 
                              ? 'border-[#4ecdc4]' 
                              : 'border-gray-700 hover:border-gray-500'
                          }`}
                        >
                          <CardContent className="p-3">
                            {/* Member header - always visible */}
                            <div 
                              className="flex items-center justify-between cursor-pointer gap-4"
                              onClick={() => handleSelectMember(member)}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div 
                                  className="w-[25px] h-[25px] min-w-[25px] min-h-[25px] flex items-center justify-center border-2 border-black text-white text-xs flex-shrink-0"
                                  style={{ backgroundColor: patrol?.color }}
                                >
                                  {member.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm">{member.name}</p>
                                  <p className="text-gray-400 text-xs">
                                    FN: {member.tasksFunkcja}   ST: {member.tasksStopien}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge className="bg-[#4ecdc4] text-black text-xs whitespace-nowrap">
                                  {memberTotal} ZAD
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveMember(member.id);
                                    if (selectedMember?.id === member.id) {
                                      setSelectedMember(null);
                                      setEditingMember(null);
                                    }
                                  }}
                                  className="text-[#ff6b6b] hover:text-[#ff4444] hover:bg-[#ff6b6b]/20"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                {isSelected ? (
                                  <ChevronUp className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                            </div>

                            {/* Expanded edit section */}
                            {isSelected && editingMember && (
                              <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
                                <div className="p-3 bg-black/50 border-2 border-gray-700">
                                  <Label className="text-[#ffd700] text-xs mb-2 block">
                                    📜 ZADANIA NA STOPIEŃ:
                                  </Label>
                                  <div className="flex items-center gap-3">
                                    <Button
                                      variant="outline"
                                      size="lg"
                                      onMouseDown={(e) => { e.preventDefault(); startHoldMemberIncrement('stopien', -1); }}
                                      onMouseUp={(e) => { e.preventDefault(); stopHoldIncrement(); }}
                                      onMouseLeave={(e) => { e.preventDefault(); stopHoldIncrement(); }}
                                      onTouchStart={(e) => { e.preventDefault(); startHoldMemberIncrement('stopien', -1); }}
                                      onTouchEnd={(e) => { e.preventDefault(); stopHoldIncrement(); }}
                                      className="border-gray-600 text-white hover:bg-gray-700 w-12 h-12 text-xl flex-shrink-0"
                                    >
                                      -
                                    </Button>
                                    <Input
                                      type="number"
                                      value={editingMember.stopien}
                                      onChange={(e) => setEditingMember(prev => prev ? { ...prev, stopien: e.target.value } : null)}
                                      className="bg-black/50 border-2 border-gray-600 text-white text-center flex-1 h-12 text-lg"
                                      min="0"
                                    />
                                    <Button
                                      variant="outline"
                                      size="lg"
                                      onMouseDown={(e) => { e.preventDefault(); startHoldMemberIncrement('stopien', 1); }}
                                      onMouseUp={(e) => { e.preventDefault(); stopHoldIncrement(); }}
                                      onMouseLeave={(e) => { e.preventDefault(); stopHoldIncrement(); }}
                                      onTouchStart={(e) => { e.preventDefault(); startHoldMemberIncrement('stopien', 1); }}
                                      onTouchEnd={(e) => { e.preventDefault(); stopHoldIncrement(); }}
                                      className="border-gray-600 text-white hover:bg-gray-700 w-12 h-12 text-xl flex-shrink-0"
                                    >
                                      +
                                    </Button>
                                  </div>
                                </div>

                                <div className="p-3 bg-black/50 border-2 border-gray-700">
                                  <Label className="text-[#ffd700] text-xs mb-2 block">
                                    ⭐ ZADANIA Z FUNKCJI:
                                  </Label>
                                  <div className="flex items-center gap-3">
                                    <Button
                                      variant="outline"
                                      size="lg"
                                      onMouseDown={(e) => { e.preventDefault(); startHoldMemberIncrement('funkcja', -1); }}
                                      onMouseUp={(e) => { e.preventDefault(); stopHoldIncrement(); }}
                                      onMouseLeave={(e) => { e.preventDefault(); stopHoldIncrement(); }}
                                      onTouchStart={(e) => { e.preventDefault(); startHoldMemberIncrement('funkcja', -1); }}
                                      onTouchEnd={(e) => { e.preventDefault(); stopHoldIncrement(); }}
                                      className="border-gray-600 text-white hover:bg-gray-700 w-12 h-12 text-xl flex-shrink-0"
                                    >
                                      -
                                    </Button>
                                    <Input
                                      type="number"
                                      value={editingMember.funkcja}
                                      onChange={(e) => setEditingMember(prev => prev ? { ...prev, funkcja: e.target.value } : null)}
                                      className="bg-black/50 border-2 border-gray-600 text-white text-center flex-1 h-12 text-lg"
                                      min="0"
                                    />
                                    <Button
                                      variant="outline"
                                      size="lg"
                                      onMouseDown={(e) => { e.preventDefault(); startHoldMemberIncrement('funkcja', 1); }}
                                      onMouseUp={(e) => { e.preventDefault(); stopHoldIncrement(); }}
                                      onMouseLeave={(e) => { e.preventDefault(); stopHoldIncrement(); }}
                                      onTouchStart={(e) => { e.preventDefault(); startHoldMemberIncrement('funkcja', 1); }}
                                      onTouchEnd={(e) => { e.preventDefault(); stopHoldIncrement(); }}
                                      className="border-gray-600 text-white hover:bg-gray-700 w-12 h-12 text-xl flex-shrink-0"
                                    >
                                      +
                                    </Button>
                                  </div>
                                </div>

                                <div className="p-2 bg-black/50 border-2 border-[#4ecdc4] text-center">
                                  <p className="text-white text-xs">
                                    SUMA: <span className="text-[#4ecdc4]">
                                      {(parseInt(editingMember.stopien) || 0) + (parseInt(editingMember.funkcja) || 0)}
                                    </span> ZADAŃ
                                  </p>
                                </div>

                                <Button 
                                  onClick={handleSaveMemberTasks}
                                  className="w-full bg-[#00ff00] hover:bg-[#00cc00] text-black border-2 border-[#009900]"
                                >
                                  💾 ZAPISZ
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}

                    {(!patrol?.members || patrol.members.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">BRAK CZŁONKÓW</p>
                        <p className="text-xs">DODAJ PIERWSZEGO CZŁONKA ZASTĘPU</p>
                      </div>
                    )}
                  </div>

                  {/* Total summary */}
                  {patrol?.members && patrol.members.length > 0 && (
                    <div className="p-3 bg-black/50 border-2 border-[#ffd700] text-center">
                      <p className="text-[#ffd700] text-xs">
                        SUMA WSZYSTKICH ZADAŃ CZŁONKÓW: <span className="text-white">{totalMemberTasks} zadań</span>
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="flex justify-end pt-4 border-t border-gray-700">
                <Button 
                  variant="outline"
                  onClick={handleLogoutAndClose}
                  className="border-2 border-[#ff6b6b] text-[#ff6b6b] hover:bg-[#ff6b6b]/20"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  WYLOGUJ
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
