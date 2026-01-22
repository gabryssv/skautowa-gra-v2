export interface Task {
  id: string;
  name: string;
  current: number;
  target: number;
  completed: boolean;
}

export interface Member {
  id: string;
  name: string;
  tasksStopien: number;  // ile zadań ze stopnia zaliczył
  tasksFunkcja: number;  // ile zadań z funkcji zaliczył
}

export interface Level {
  level: number;
  name: string;
  tasks: Task[];
  isUnlocked: boolean;
  isCompleted: boolean;
}

export interface Patrol {
  id: string;
  name: string;
  color: string;
  currentLevel: number;
  levels: Level[];
  members: Member[];
}

export const INITIAL_LEVELS: Omit<Level, 'isUnlocked' | 'isCompleted'>[] = [
  {
    level: 1,
    name: "Poziom 1 - Początek Przygody",
    tasks: [
      { id: "l1-t1", name: "Zbiórki zastępu", current: 0, target: 4, completed: false },
      { id: "l1-t2", name: "Zadania na stopień + zadania z funkcji", current: 0, target: 20, completed: false },
      { id: "l1-t3", name: "Zbudowanie jednej nowej konstrukcji w miejscu zbiórki", current: 0, target: 1, completed: false },
      { id: "l1-t4", name: "Zrobić sztandar swojego państwa", current: 0, target: 1, completed: false },
      { id: "l1-t5", name: "Mieć imiona postaci fabularnych w zastępie", current: 0, target: 1, completed: false },
      { id: "l1-t6", name: "Relacja ze zbiórki (zdjęcie)", current: 0, target: 1, completed: false },
      { id: "l1-t7", name: "Przygotować małą aktywność na zimowisko", current: 0, target: 1, completed: false }
    ]
  },
  {
    level: 2,
    name: "Poziom 2 - Rozwój Zastępu",
    tasks: [
      { id: "l2-t1", name: "Zbiórki zastępu", current: 0, target: 9, completed: false },
      { id: "l2-t2", name: "Zadania na stopień + zadania z funkcji", current: 0, target: 40, completed: false },
      { id: "l2-t3", name: "Zbudowanie kuchni zastępu", current: 0, target: 1, completed: false },
      { id: "l2-t4", name: "Zrobić stroje fabularne", current: 0, target: 1, completed: false },
      { id: "l2-t5", name: "Każda osoba ma postać w zastępie wraz z historią", current: 0, target: 1, completed: false },
      { id: "l2-t6", name: "Relacja zdjęciowa ze zbiórki wraz z opisem", current: 0, target: 1, completed: false },
      { id: "l2-t7", name: "Przygotować aktywność na zimowisko", current: 0, target: 1, completed: false }
    ]
  },
  {
    level: 3,
    name: "Poziom 3 - Mistrzostwo",
    tasks: [
      { id: "l3-t1", name: "Zbiórki zastępu", current: 0, target: 15, completed: false },
      { id: "l3-t2", name: "Zadania na stopień + zadania z funkcji", current: 0, target: 60, completed: false },
      { id: "l3-t3", name: "Zbudowanie kompleksowego obozowiska zastępu (jak na obozie) w miejscu zbiórek", current: 0, target: 1, completed: false },
      { id: "l3-t4", name: "Nowy członek zastępu", current: 0, target: 1, completed: false },
      { id: "l3-t5", name: "Przeprowadzenie misji wyznaczonej w porozumieniu z drużynowym", current: 0, target: 1, completed: false },
      { id: "l3-t6", name: "Zrobić bronie fabularne do strojów", current: 0, target: 1, completed: false },
      { id: "l3-t7", name: "Przygotować scenkę przedstawiającą naród i każdą z postaci", current: 0, target: 1, completed: false },
      { id: "l3-t8", name: "Filmik dowolnej tematyki skonsultowanej z drużynowym ze zbiórki", current: 0, target: 1, completed: false },
      { id: "l3-t9", name: "Porządna aktywność na zimowisko", current: 0, target: 1, completed: false }
    ]
  }
];

export function getIncrementalProgress(task: Task, levels: Level[], currentLevelIndex: number): { current: number; target: number } {
  const taskType = task.id.substring(task.id.indexOf('-t'));
  
  // Weź target z poprzedniego poziomu (próg który trzeba przekroczyć)
  let previousThreshold = 0;
  if (currentLevelIndex > 0) {
    const previousTask = levels[currentLevelIndex - 1].tasks.find(t => t.id.endsWith(taskType));
    if (previousTask) {
      previousThreshold = previousTask.target;
    }
  }
  
  const incrementalTarget = task.target - previousThreshold;
  
  // Jeśli incrementalTarget <= 0, zadanie NIE jest inkrementalne (np. target=1 na każdym poziomie)
  if (incrementalTarget <= 0) {
    return {
      current: task.current,
      target: task.target
    };
  }
  
  // Zadanie jest inkrementalne (np. zadania na stopień: 20 -> 40 -> 60)
  const incrementalCurrent = Math.max(0, task.current - previousThreshold);
  
  return {
    current: Math.min(incrementalCurrent, incrementalTarget),
    target: incrementalTarget
  };
}
