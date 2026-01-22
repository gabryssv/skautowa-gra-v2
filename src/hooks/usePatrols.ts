import { useState, useEffect, useCallback } from 'react';
import type { Patrol, Member } from '../types/game';
import { INITIAL_LEVELS } from '../types/game';
import { supabase } from '../lib/supabase';

interface UsePatrolsReturn {
  patrols: Patrol[];
  loading: boolean;
  error: string | null;
  updateTask: (patrolId: string, levelIndex: number, taskId: string, newCurrent: number) => void;
  addMember: (patrolId: string, name: string) => void;
  removeMember: (patrolId: string, memberId: string) => void;
  updateMemberTasks: (patrolId: string, memberId: string, tasksStopien: number, tasksFunkcja: number) => void;
}

// DB Row types
interface PatrolRow {
  id: string;
  name: string;
  color: string;
}

interface TaskRow {
  patrol_id: string;
  task_key: string;
  current: number;
}

interface MemberRow {
  id: string;
  patrol_id: string;
  name: string;
  tasks_stopien: number;
  tasks_funkcja: number;
}

interface UsePatrolsReturn {
  patrols: Patrol[];
  loading: boolean;
  error: string | null;
  updateTask: (patrolId: string, levelIndex: number, taskId: string, newCurrent: number) => void;
  addMember: (patrolId: string, name: string) => void;
  removeMember: (patrolId: string, memberId: string) => void;
  updateMemberTasks: (patrolId: string, memberId: string, tasksStopien: number, tasksFunkcja: number) => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function recalculatePatrol(patrol: Patrol): Patrol {
  // Recalculate task completion
  for (const level of patrol.levels) {
    for (const task of level.tasks) {
      if (task.id.includes('-t2')) {
        // Task t2 (zadania na stopień + funkcji) = suma od wszystkich członków
        const totalTasks = patrol.members.reduce((sum, m) => 
          sum + m.tasksStopien + m.tasksFunkcja, 0
        );
        task.current = totalTasks;
        task.completed = totalTasks >= task.target;
      } else {
        // Inne zadania (np. zbiórki) - wartość current jest ustawiana bezpośrednio
        task.completed = task.current >= task.target;
      }
    }
    level.isCompleted = level.tasks.every(t => t.completed);
  }

  // Unlock levels
  for (let i = 1; i < patrol.levels.length; i++) {
    patrol.levels[i].isUnlocked = patrol.levels[i - 1].isCompleted;
  }

  // Calculate current level
  patrol.currentLevel = 0;
  for (let i = 0; i < patrol.levels.length; i++) {
    if (patrol.levels[i].isCompleted) {
      patrol.currentLevel = i + 1;
    } else {
      break;
    }
  }

  return patrol;
}

// Build patrol from database data
function buildPatrolFromDb(
  patrolData: { id: string; name: string; color: string },
  tasksData: { task_key: string; current: number }[],
  membersData: { id: string; name: string; tasks_stopien: number; tasks_funkcja: number }[]
): Patrol {
  // Create levels from template
  const levels = INITIAL_LEVELS.map((levelTemplate, index) => ({
    level: levelTemplate.level,
    name: levelTemplate.name,
    tasks: levelTemplate.tasks.map(t => {
      const dbTask = tasksData.find(dt => dt.task_key === t.id);
      return { 
        ...t, 
        current: dbTask?.current ?? 0 
      };
    }),
    isUnlocked: index === 0,
    isCompleted: false,
  }));

  // Create members
  const members: Member[] = membersData.map(m => ({
    id: m.id,
    name: m.name,
    tasksStopien: m.tasks_stopien ?? 0,
    tasksFunkcja: m.tasks_funkcja ?? 0,
  }));

  return recalculatePatrol({
    id: patrolData.id,
    name: patrolData.name,
    color: patrolData.color,
    currentLevel: 0,
    levels,
    members,
  });
}

export function usePatrols(): UsePatrolsReturn {
  const [patrols, setPatrols] = useState<Patrol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from Supabase
  const loadData = useCallback(async () => {
    try {
      // Fetch all data in parallel
      const [patrolsRes, tasksRes, membersRes] = await Promise.all([
        supabase.from('patrols').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('members').select('*'),
      ]);

      if (patrolsRes.error) throw patrolsRes.error;
      if (tasksRes.error) throw tasksRes.error;
      if (membersRes.error) throw membersRes.error;

      const patrolsData = (patrolsRes.data || []) as PatrolRow[];
      const tasksData = (tasksRes.data || []) as TaskRow[];
      const membersData = (membersRes.data || []) as MemberRow[];

      const builtPatrols = patrolsData.map(p => 
        buildPatrolFromDb(
          p,
          tasksData.filter(t => t.patrol_id === p.id),
          membersData.filter(m => m.patrol_id === p.id)
        )
      );

      setPatrols(builtPatrols);
      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Błąd wczytywania danych z bazy');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => loadData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const updateTask = useCallback(async (patrolId: string, levelIndex: number, taskId: string, newCurrent: number) => {
    // Optimistic update
    setPatrols(prev => prev.map(patrol => {
      if (patrol.id !== patrolId) return patrol;
      
      const newLevels = patrol.levels.map((level, idx) => {
        if (idx !== levelIndex) return level;
        
        const newTasks = level.tasks.map(task => {
          if (task.id !== taskId) return task;
          return { ...task, current: Math.max(0, newCurrent) };
        });
        
        return { ...level, tasks: newTasks };
      });
      
      return recalculatePatrol({ ...patrol, levels: newLevels });
    }));

    // Save to Supabase
    try {
      const { error } = await supabase
        .from('tasks')
        .upsert(
          { patrol_id: patrolId, task_key: taskId, current: Math.max(0, newCurrent) } as any,
          { onConflict: 'patrol_id,task_key' }
        );
      
      if (error) {
        console.error('Error updating task:', error);
        loadData(); // Reload on error
      }
    } catch (err) {
      console.error('Error updating task:', err);
      loadData();
    }
  }, [loadData]);

  const addMember = useCallback(async (patrolId: string, name: string) => {
    const memberId = generateId();
    
    // Optimistic update
    const newMember: Member = {
      id: memberId,
      name: name.trim(),
      tasksStopien: 0,
      tasksFunkcja: 0,
    };

    setPatrols(prev => prev.map(patrol => {
      if (patrol.id !== patrolId) return patrol;
      return recalculatePatrol({
        ...patrol,
        members: [...patrol.members, newMember],
      });
    }));

    // Save to Supabase
    try {
      const { error } = await supabase
        .from('members')
        .insert({ 
          id: memberId, 
          patrol_id: patrolId, 
          name: name.trim(),
          tasks_stopien: 0,
          tasks_funkcja: 0
        } as any);
      
      if (error) {
        console.error('Error adding member:', error);
        loadData();
      }
    } catch (err) {
      console.error('Error adding member:', err);
      loadData();
    }
  }, [loadData]);

  const removeMember = useCallback(async (patrolId: string, memberId: string) => {
    // Optimistic update
    setPatrols(prev => prev.map(patrol => {
      if (patrol.id !== patrolId) return patrol;
      return recalculatePatrol({
        ...patrol,
        members: patrol.members.filter(m => m.id !== memberId),
      });
    }));

    // Delete from Supabase
    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);
      
      if (error) {
        console.error('Error removing member:', error);
        loadData();
      }
    } catch (err) {
      console.error('Error removing member:', err);
      loadData();
    }
  }, [loadData]);

  const updateMemberTasks = useCallback(async (patrolId: string, memberId: string, tasksStopien: number, tasksFunkcja: number) => {
    // Optimistic update
    setPatrols(prev => prev.map(patrol => {
      if (patrol.id !== patrolId) return patrol;
      
      const newMembers = patrol.members.map(member => {
        if (member.id !== memberId) return member;
        return { ...member, tasksStopien, tasksFunkcja };
      });
      
      return recalculatePatrol({ ...patrol, members: newMembers });
    }));

    // Save to Supabase
    try {
      const { error } = await (supabase
        .from('members') as any)
        .update({ tasks_stopien: tasksStopien, tasks_funkcja: tasksFunkcja })
        .eq('id', memberId);
      
      if (error) {
        console.error('Error updating member tasks:', error);
        loadData();
      }
    } catch (err) {
      console.error('Error updating member tasks:', err);
      loadData();
    }
  }, [loadData]);

  return {
    patrols,
    loading,
    error,
    updateTask,
    addMember,
    removeMember,
    updateMemberTasks,
  };
}
