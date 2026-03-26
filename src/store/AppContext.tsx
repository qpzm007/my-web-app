import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Project, FactoryProcess, Worker, LogEntry, HelpSignal } from '../types';

interface AppContextType {
  currentUser: Worker | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<Worker | null>>;
  activeProjectId: string;
  setActiveProjectId: React.Dispatch<React.SetStateAction<string>>;
  
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  allProcesses: FactoryProcess[];
  setAllProcesses: React.Dispatch<React.SetStateAction<FactoryProcess[]>>;
  allWorkers: Worker[];
  setAllWorkers: React.Dispatch<React.SetStateAction<Worker[]>>;
  
  logs: LogEntry[];
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  helpSignals: HelpSignal[];
  setHelpSignals: React.Dispatch<React.SetStateAction<HelpSignal[]>>;
  
  // Derived Data Helpers
  activeProject: Project | undefined;
  processes: FactoryProcess[];
  workers: Worker[];
}

const INITIAL_PROJECTS: Project[] = [
  { id: 'proj1', name: '라인 A-01 (자동차 부품)', targetQuantity: 5000, targetDate: '2026-04-30', startDate: '2026-03-01' }
];

const INITIAL_PROCESSES: FactoryProcess[] = [
  { id: 'p1', projectId: 'proj1', name: '정밀 가공', status: 'normal', inventory: 120, avgTime: 10, currentTime: 8, requiredAmount: 1, description: 'CNC 선반 가공' },
  { id: 'p2', projectId: 'proj1', name: '조립 라인', status: 'delay', inventory: 450, avgTime: 25, currentTime: 32, requiredAmount: 2, description: '부품 체결' }
];

const INITIAL_WORKERS: Worker[] = [
  { id: 'admin', loginId: 'admin', password: '1234', role: 'master', projectId: 'proj1', name: '최고관리자', department: '시스템', skillLevel: 10, avatar: 'https://ui-avatars.com/api/?name=Admin&background=f97316&color=fff' },
  { id: 'm1', loginId: 'm1', password: '1', role: 'manager', projectId: 'proj1', name: '이수진', department: '생산관리팀', skillLevel: 8, avatar: 'https://ui-avatars.com/api/?name=이수진&background=random' },
  { id: 'w1', loginId: 'w1', password: '1', role: 'worker', projectId: 'proj1', name: '김철수', department: '가공팀', skillLevel: 9, currentProcessId: 'p1', taskState: 'waiting', assignedQuantity: 100, avatar: 'https://ui-avatars.com/api/?name=김철수&background=random' },
  { id: 'w2', loginId: 'w2', password: '1', role: 'worker', projectId: 'proj1', name: '박영희', department: '조립팀', skillLevel: 5, currentProcessId: 'p2', taskState: 'working', assignedQuantity: 200, avatar: 'https://ui-avatars.com/api/?name=박영희&background=random' },
  { id: 'w3', loginId: 'w3', password: '1', role: 'worker', projectId: 'proj1', name: '정민수', department: '대기조', skillLevel: 7, taskState: 'waiting', avatar: 'https://ui-avatars.com/api/?name=정민수&background=random' }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

function useSupabaseSync<T extends { id: string }>(tableName: string): [T[], React.Dispatch<React.SetStateAction<T[]>>, boolean] {
  const [data, setData] = useState<T[]>([]);
  const isLoadedRef = useRef(false);

  useEffect(() => {
    // 1. Initial Load
    supabase.from(tableName).select('*').then(({ data: rows, error }) => {
      if (!error && rows) {
        setData(rows as T[]);
        isLoadedRef.current = true;
      } else {
        console.error(`Failed to load ${tableName}:`, error);
      }
    });

    // 2. Real-time Subscription
    const channel = supabase.channel(`public:${tableName}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setData(prev => {
             if (prev.find(p => p.id === payload.new.id)) return prev;
             return [...prev, payload.new as T];
          });
        } else if (payload.eventType === 'UPDATE') {
          setData(prev => prev.map(item => item.id === payload.new.id ? (payload.new as T) : item));
        } else if (payload.eventType === 'DELETE') {
          setData(prev => prev.filter(item => item.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tableName]);

  // 3. Proxy Dispatcher
  const setSyncData: React.Dispatch<React.SetStateAction<T[]>> = (action) => {
    setData((prev) => {
      const nextData = typeof action === 'function' ? (action as any)(prev) : action;
      
      if (isLoadedRef.current) {
        setTimeout(async () => {
          // Send explicit individual updates to prevent bulk upsert rejection
          for (const item of nextData) {
            const pItem = prev.find(p => p.id === item.id);
            if (!pItem || JSON.stringify(pItem) !== JSON.stringify(item)) {
              // Sanitize undefined to null
              const safeItem = { ...item };
              Object.keys(safeItem).forEach(k => {
                if ((safeItem as any)[k] === undefined) (safeItem as any)[k] = null;
              });
              
              const { error } = await supabase.from(tableName).upsert(safeItem);
              if (error) console.error(`Failed to sync ${tableName} item [${item.id}]:`, error.message);
            }
          }
          
          const deletes = prev.filter(item => !nextData.find(n => n.id === item.id));
          if (deletes.length > 0) {
            await supabase.from(tableName).delete().in('id', deletes.map(d => d.id));
          }
        }, 0);
      }
      return nextData;
    });
  };

  return [data, setSyncData, isLoadedRef.current];
}

export function AppProvider({ children }: { children: ReactNode }) {
  // `currentUser` must remain per-tab (sessionStorage), otherwise logging in as W1 ruins Admin's login state
  const [currentUser, setCurrentUser] = useState<Worker | null>(() => {
    const saved = sessionStorage.getItem('sf_curr_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (currentUser) sessionStorage.setItem('sf_curr_user', JSON.stringify(currentUser));
    else sessionStorage.removeItem('sf_curr_user');
  }, [currentUser]);

  // `activeProjectId` is UI state, keep local
  const [activeProjectId, setActiveProjectId] = useState<string>(() => sessionStorage.getItem('sf_active_proj') || 'proj1');
  useEffect(() => sessionStorage.setItem('sf_active_proj', activeProjectId), [activeProjectId]);

  // All core operational data is automatically magically synced to Supabase Postgres over WebSockets via useSupabaseSync!
  const [projects, setProjects] = useSupabaseSync<Project>('projects');
  const [allProcesses, setAllProcesses] = useSupabaseSync<FactoryProcess>('processes');
  const [allWorkers, setAllWorkers] = useSupabaseSync<Worker>('workers');
  const [logs, setLogs] = useSupabaseSync<LogEntry>('logs');
  const [helpSignals, setHelpSignals] = useSupabaseSync<HelpSignal>('help_signals');

  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];
  const processes = allProcesses.filter(p => p.projectId === activeProjectId);
  const workers = allWorkers.filter(w => w.projectId === activeProjectId && w.role === 'worker');

  // Prevent UI flickering while Supabase fetches (if projects is empty, wait just briefly)
  if (!projects.length) {
     return <div className="min-h-screen bg-[#0F1115] flex items-center justify-center text-orange-500 font-bold animate-pulse">SUPABASE CONNECTING...</div>;
  }

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser,
      activeProjectId, setActiveProjectId,
      projects, setProjects,
      allProcesses, setAllProcesses,
      allWorkers, setAllWorkers,
      logs, setLogs,
      helpSignals, setHelpSignals,
      activeProject, processes, workers
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
