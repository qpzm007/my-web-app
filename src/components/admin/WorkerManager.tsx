import React, { useState } from 'react';
import { Users, Search, Plus, Trash2, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useAppContext } from '../../store/AppContext';
import { Worker } from '../../types';
import WorkerPerformanceModal from './WorkerPerformanceModal';

export default function WorkerManager() {
  const { allWorkers, setAllWorkers, activeProjectId, processes, projects, allProcesses } = useAppContext();
  
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [workerFormData, setWorkerFormData] = useState({ loginId: '', password: '', role: 'worker' as 'worker'|'manager', name: '', department: '', skillLevel: 5 });
  
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [performanceWorker, setPerformanceWorker] = useState<Worker | null>(null);

  const departments = Array.from(new Set(allWorkers.filter(w => w.role === 'worker' && w.department).map(w => w.department)));

  const saveWorker = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingWorker) {
      setAllWorkers(prev => prev.map(w => w.id === editingWorker.id ? { ...w, ...workerFormData } : w));
    } else {
      const newWorker: Worker = {
        id: `w-${Date.now()}`,
        projectId: activeProjectId,
        loginId: workerFormData.loginId,
        password: workerFormData.password,
        role: workerFormData.role,
        name: workerFormData.name,
        department: workerFormData.department,
        skillLevel: workerFormData.skillLevel,
        taskState: 'waiting',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(workerFormData.name)}&background=random`
      };
      setAllWorkers(prev => [...prev, newWorker]);
    }
    setShowWorkerModal(false);
  };

  const manualRecallWorker = async (worker: Worker) => {
    if (confirm(`[${worker.name}] 작업자에게 즉시 하던 작업을 멈추고 현장 대기조로 복귀하라고 명령하시겠습니까?`)) {
      setAllWorkers(prev => prev.map(w => w.id === worker.id ? {
         ...w,
         currentProcessId: null,
         assignedQuantity: null,
         taskState: 'waiting'
      } : w));
    }
  };

  const deleteWorker = (id: string, name: string) => {
    if(confirm(`${name} 계정을 완전히 삭제하시겠습니까?`)) {
      setAllWorkers(prev => prev.filter(w => w.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2"><Users className="text-orange-500 w-6 h-6"/> 계정 및 인력 관리</h2>
        <div className="flex gap-2">
          <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className="bg-[#1A1D23] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none">
            <option value="all">전체 프로젝트 (통합)</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={selectedDepartment} onChange={e => setSelectedDepartment(e.target.value)} className="bg-[#1A1D23] border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none">
            <option value="all">전체 부서</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="bg-[#1A1D23] border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input type="text" placeholder="이름 검색" className="bg-transparent border-none text-sm text-white outline-none w-32" />
          </div>
          <button onClick={() => { setEditingWorker(null); setWorkerFormData({ loginId: '', password: '', role: 'worker', name: '', department: '', skillLevel: 5 }); setShowWorkerModal(true); }} className="bg-orange-500 hover:bg-orange-400 text-black font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" /> 신규 계정
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allWorkers.filter(w => 
          (selectedProjectId === 'all' || w.projectId === selectedProjectId) && 
          (selectedDepartment === 'all' || w.department === selectedDepartment)
        ).map(w => {
           const pName = processes.find(p => p.id === w.currentProcessId)?.name || '알 수 없음';
           const projName = projects.find(proj => proj.id === w.projectId)?.name || '알 수 없는 프로젝트';
           return (
             <div key={w.id} className="bg-[#1A1D23] rounded-3xl p-5 border border-white/5 relative group hover:border-orange-500/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <img src={w.avatar} alt="avatar" className="w-12 h-12 rounded-full shadow-lg" />
                    <div>
                      <h3 className="font-bold text-lg flex items-center gap-2">{w.name} {w.role === 'master' && <span className="bg-red-500/20 text-red-500 text-[10px] px-2 py-0.5 rounded-full uppercase">master</span>} {w.role === 'manager' && <span className="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-full uppercase">manager</span>}</h3>
                      <p className="text-xs text-gray-500">ID: {w.loginId}</p>
                    </div>
                  </div>
                  {w.role !== 'master' && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingWorker(w); setWorkerFormData({ loginId: w.loginId, password: w.password, role: w.role, name: w.name, department: w.department, skillLevel: w.skillLevel }); setShowWorkerModal(true); }} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg"><Edit className="w-3.5 h-3.5 text-gray-400 hover:text-white"/></button>
                      <button onClick={() => deleteWorker(w.id, w.name)} className="p-1.5 bg-white/5 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500"/></button>
                    </div>
                  )}
                </div>

                {w.role === 'worker' && (
                  <>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                      <span>{w.department}</span> • <span className="text-orange-400 font-bold">LV.{w.skillLevel}</span>
                    </div>
                    {w.taskState === 'waiting' && <p className="text-sm text-yellow-500 font-bold bg-yellow-500/10 inline-block px-3 py-1 rounded-full border border-yellow-500/20 mb-3">대기 중 (할당 대기)</p>}
                    {w.taskState === 'working' && <p className="text-sm text-green-500 font-bold bg-green-500/10 inline-block px-3 py-1 rounded-full border border-green-500/20 mb-3">작업 중: [{projName}] {pName}</p>}
                    {w.taskState === 'paused' && <p className="text-sm text-gray-400 font-bold bg-white/5 inline-block px-3 py-1 rounded-full border border-white/10 mb-3">일시 정지: [{projName}] {pName}</p>}

                    <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
                      <button onClick={() => setPerformanceWorker(w)} className="flex-1 py-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-bold rounded-xl border border-purple-500/20 transition-colors shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                        📊 일솜씨 (개인 성과) 분석표
                      </button>
                    </div>
                  </>
                )}

                {w.role === 'worker' && w.taskState !== 'waiting' && (
                  <>
                    <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
                       <button onClick={() => manualRecallWorker(w)} className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold rounded-xl border border-red-500/20 transition-colors">
                         명령 취소 및 대기조 강제 복귀
                       </button>
                    </div>
                  </>
                )}
             </div>
           );
        })}
      </div>

      <AnimatePresence>
        {/* Worker Create/Edit Modal */}
        {showWorkerModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1A1D23] border border-white/10 rounded-3xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-bold mb-4">{editingWorker ? '계정 수정' : '신규 계정 발급'}</h3>
              <form onSubmit={saveWorker} className="space-y-3">
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <button type="button" onClick={() => setWorkerFormData({...workerFormData, role: 'manager'})} className={cn("py-2 rounded-xl text-xs font-bold border transition-colors", workerFormData.role === 'manager' ? "bg-blue-500/20 text-blue-400 border-blue-500/50" : "bg-white/5 text-gray-500 border-white/5")}>관리자</button>
                  <button type="button" onClick={() => setWorkerFormData({...workerFormData, role: 'worker'})} className={cn("py-2 rounded-xl text-xs font-bold border transition-colors", workerFormData.role === 'worker' ? "bg-orange-500/20 text-orange-500 border-orange-500/50" : "bg-white/5 text-gray-500 border-white/5")}>작업자</button>
                </div>
                <div><label className="text-xs text-gray-400 mb-1 block">이름</label><input type="text" required value={workerFormData.name} onChange={e => setWorkerFormData({...workerFormData, name: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-orange-500" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">로그인 ID</label><input type="text" required value={workerFormData.loginId} onChange={e => setWorkerFormData({...workerFormData, loginId: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-orange-500" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">비밀번호</label><input type="text" required value={workerFormData.password} onChange={e => setWorkerFormData({...workerFormData, password: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-orange-500" /></div>
                <div className={workerFormData.role === 'worker' ? 'block' : 'hidden'}>
                  <label className="text-xs text-gray-400 mb-1 block">소속 (작업자 전용)</label><input type="text" value={workerFormData.department} onChange={e => setWorkerFormData({...workerFormData, department: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none" placeholder="예: 조립팀" />
                </div>
                <div className={workerFormData.role === 'worker' ? 'block pt-2' : 'hidden'}>
                  <label className="text-xs text-gray-400 mb-1 flex justify-between"><span>숙련도 (작업자 전용)</span><span className="text-orange-500 font-bold">LV. {workerFormData.skillLevel}</span></label>
                  <input type="range" min="1" max="10" value={workerFormData.skillLevel} onChange={e => setWorkerFormData({...workerFormData, skillLevel: parseInt(e.target.value)})} className="w-full accent-orange-500" />
                </div>
                <div className="flex gap-2 mt-4 pt-2">
                  <button type="button" onClick={() => setShowWorkerModal(false)} className="w-1/3 py-3 bg-white/5 rounded-xl font-bold text-sm">취소</button>
                  <button type="submit" className="w-2/3 py-3 bg-orange-500 text-black font-bold rounded-xl text-sm hover:bg-orange-400 transition-colors">저장하기</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
        {performanceWorker && (
          <WorkerPerformanceModal worker={performanceWorker} onClose={() => setPerformanceWorker(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
