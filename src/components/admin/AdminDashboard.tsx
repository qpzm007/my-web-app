import React, { useState } from 'react';
import { Zap, Settings, Activity, Users, Network } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useAppContext } from '../../store/AppContext';
import SimulationView from './SimulationView';
import ProcessListView from './ProcessListView';
import WorkerManager from './WorkerManager';
import MindmapView from './MindmapView';
import ProjectSetupModal from './ProjectSetupModal';
import LiveAlertsPanel from './LiveAlertsPanel';

type TabType = 'dashboard' | 'workers' | 'mindmap';

export default function AdminDashboard() {
  const { currentUser, setCurrentUser, projects, activeProjectId, setActiveProjectId } = useAppContext();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showProjectSetup, setShowProjectSetup] = useState(false);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-[#0F1115] text-white font-sans selection:bg-orange-500/30">
      <header className="sticky top-0 z-50 bg-[#0F1115]/80 backdrop-blur-md border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center"><Zap className="w-5 h-5 text-black fill-current" /></div>
            <h1 className="text-lg font-bold tracking-tight hidden sm:block">SmartFactory <span className="text-orange-500">Go</span> Admin</h1>
          </div>
          <select className="bg-[#1A1D23] border border-white/10 rounded-xl px-3 py-1.5 text-sm font-bold text-orange-500 outline-none hover:border-orange-500/50 transition-colors"
            value={activeProjectId} onChange={(e) => { setActiveProjectId(e.target.value); setActiveTab('dashboard'); }}>
            {projects.map(proj => <option key={proj.id} value={proj.id}>{proj.name}</option>)}
          </select>
          <button onClick={() => setShowProjectSetup(true)} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl flex items-center gap-2 text-sm font-bold transition-all"><Settings className="w-4 h-4"/> 공정 추가</button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-400 px-3 border-r border-white/10">
            {currentUser.name} ({currentUser.role})
          </div>
          <button onClick={() => setCurrentUser(null)} className="text-xs font-bold text-gray-500 hover:text-white transition-colors">LOGOUT</button>
        </div>
      </header>

      <main className={cn("p-4 pb-24 mx-auto animate-in fade-in slide-in-from-bottom-4", activeTab === 'mindmap' ? "max-w-screen-2xl" : "max-w-6xl")}>
        {activeTab === 'dashboard' && (
          <>
            <SimulationView />
            <ProcessListView />
            <LiveAlertsPanel />
          </>
        )}
        {activeTab === 'workers' && <WorkerManager />}
        {activeTab === 'mindmap' && <MindmapView />}
      </main>

      <AnimatePresence>
         {showProjectSetup && <ProjectSetupModal onClose={() => setShowProjectSetup(false)} />}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-[#0F1115]/90 backdrop-blur-xl border-t border-white/10 px-6 py-4 flex justify-between items-center z-40">
        <button onClick={() => setActiveTab('dashboard')} className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'dashboard' ? "text-orange-500" : "text-gray-500")}>
          <Activity className="w-6 h-6" /> <span className="text-[10px] font-bold">대시보드</span>
        </button>
        <button onClick={() => setActiveTab('workers')} className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'workers' ? "text-orange-500" : "text-gray-500")}>
          <Users className="w-6 h-6" /> <span className="text-[10px] font-bold">인력/계정관리</span>
        </button>
        <div className="relative -top-8">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setActiveTab('mindmap')}
            className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.5)] border-4 border-[#0F1115]", activeTab === 'mindmap' ? "bg-white text-orange-500" : "bg-orange-500 text-black")}>
            <Network className="w-7 h-7" />
          </motion.button>
        </div>
      </nav>
    </div>
  );
}
