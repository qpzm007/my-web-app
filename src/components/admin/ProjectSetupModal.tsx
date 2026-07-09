import React, { useState } from 'react';
import { Settings, X, Edit, Trash2, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { useAppContext } from '../../store/AppContext';
import type { Project, FactoryProcess } from '../../types';

export default function ProjectSetupModal({ onClose }: { onClose: () => void }) {
  const { 
    projects, setProjects, 
    allProcesses, setAllProcesses, 
    activeProjectId, setActiveProjectId, 
    activeProject, processes, allWorkers 
  } = useAppContext();

  const [setupTab, setSetupTab] = useState<'projects' | 'processes'>('processes');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectFormData, setProjectFormData] = useState({ name: '', targetQuantity: 0, startDate: '', targetDate: '' });
  const [editingProcess, setEditingProcess] = useState<FactoryProcess | null>(null);
  const [processFormData, setProcessFormData] = useState({ name: '', description: '', inventory: 0, avgTime: 0, requiredAmount: 1 });

  const saveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if(editingProject) {
      setProjects(prev => prev.map(p => p.id === editingProject.id ? { ...editingProject, ...projectFormData } : p));
    } else {
      setProjects(prev => [...prev, { id: `proj-${Date.now()}`, ...projectFormData }]);
    }
    setEditingProject(null);
  };
  
  const deleteProject = (id: string) => {
    if(allProcesses.some(p => p.projectId === id) || allWorkers.some(w => w.projectId === id)) {
       alert("이 프로젝트에 종속된 공정이나 작업자가 있어 삭제할 수 없습니다 (Safety Lock). 먼저 공정/인력을 삭제하거나 다른 프로젝트로 변경하세요.");
       return;
    }
    if(confirm("정말 이 프로젝트를 삭제하시겠습니까?")) {
      setProjects(prev => prev.filter(p => p.id !== id));
      if(activeProjectId === id) setActiveProjectId(projects[0]?.id || '');
    }
  };

  const saveProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if(editingProcess) {
      setAllProcesses(prev => prev.map(p => p.id === editingProcess.id ? { ...editingProcess, ...processFormData } : p));
    } else {
      setAllProcesses(prev => [...prev, { id: `proc-${Date.now()}`, projectId: activeProjectId, status: 'normal', currentTime: 0, ...processFormData }]);
    }
    setEditingProcess(null);
  };

  const deleteProcess = (id: string, name: string) => {
    if(allWorkers.some(w => w.currentProcessId === id)) {
       alert(`현재 [${name}] 방에 배치된 인력이 있어 삭제할 수 없습니다. 먼저 인력을 다른 방으로 배치하세요.`);
       return;
    }
    if(confirm(`[${name}] 공정을 완전히 삭제하시겠습니까?`)) {
      setAllProcesses(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/90 p-4 flex flex-col justify-center items-center backdrop-blur-sm">
      <div className="bg-[#1A1D23] rounded-3xl p-6 border-t border-white/20 w-full max-w-5xl mx-auto shadow-2xl relative flex flex-col h-[80vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Settings className="text-orange-500 w-6 h-6"/> 시스템 설정 (프로젝트 & 공정 BOM)</h2>
          <button onClick={onClose}><X className="text-gray-500 hover:text-white w-6 h-6"/></button>
        </div>
        <div className="flex gap-4 mb-6">
          <button onClick={() => setSetupTab('projects')} className={cn("px-4 py-2 rounded-xl font-bold transition-all", setupTab === 'projects' ? "bg-orange-500 text-black shadow-lg" : "bg-white/5 text-gray-400 hover:bg-white/10")}>프로젝트 (생산 라인)</button>
          <button onClick={() => setSetupTab('processes')} className={cn("px-4 py-2 rounded-xl font-bold transition-all", setupTab === 'processes' ? "bg-orange-500 text-black shadow-lg" : "bg-white/5 text-gray-400 hover:bg-white/10")}>공정 및 단위 소요량 (BOM)</button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* List Panel */}
          <div>
            <h3 className="font-bold mb-4">{setupTab === 'projects' ? '등록된 전체 라인 목록' : `[${activeProject?.name}] 소속 공정 목록`}</h3>
            <div className="space-y-3">
              {setupTab === 'projects' && projects.map(p => (
                <div key={p.id} className="bg-black/50 p-4 rounded-2xl border border-white/5 flex justify-between items-center transition-all hover:bg-white/5">
                  <div><p className="font-bold text-lg">{p.name}</p><p className="text-xs text-gray-400 mt-1">목표: <span className="text-orange-400 font-bold">{p.targetQuantity}EA</span> | {p.startDate} ~ {p.targetDate}</p></div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setEditingProject(p); setProjectFormData({ name: p.name, targetQuantity: p.targetQuantity||0, startDate: p.startDate||'', targetDate: p.targetDate||'' }); }} className="text-gray-500 hover:text-white p-2 bg-white/5 rounded-xl"><Edit className="w-4 h-4"/></button>
                    <button type="button" onClick={() => deleteProject(p.id)} className="text-gray-500 hover:text-red-500 p-2 bg-white/5 rounded-xl"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              ))}
              {setupTab === 'processes' && processes.map(p => (
                <div key={p.id} className="bg-black/50 p-4 rounded-2xl border border-white/5 flex justify-between items-center transition-all hover:bg-white/5">
                  <div>
                    <p className="font-bold flex items-center gap-2 text-lg">{p.name} <span className="bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded-full text-[10px] uppercase border border-orange-500/30 font-mono">소요량: {p.requiredAmount}EA</span></p>
                    <p className="text-sm text-gray-400 mt-1">{p.description}</p>
                    <p className="text-xs text-gray-500 mt-2 font-mono">대기재고: {p.inventory} | 평균시간: {p.avgTime}분</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setEditingProcess(p); setProcessFormData({ name: p.name, description: p.description, inventory: p.inventory, avgTime: p.avgTime, requiredAmount: p.requiredAmount }); }} className="text-gray-500 hover:text-white p-2 bg-white/5 rounded-xl"><Edit className="w-4 h-4"/></button>
                    <button type="button" onClick={() => deleteProcess(p.id, p.name)} className="text-gray-500 hover:text-red-500 p-2 bg-white/5 rounded-xl"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              ))}
              {setupTab === 'processes' && processes.length === 0 && <div className="p-8 text-center text-gray-500 border border-dashed rounded-2xl">등록된 공정이 없습니다.</div>}
            </div>
            <button type="button" onClick={() => { setupTab === 'projects' ? (setEditingProject(null), setProjectFormData({ name: '', targetQuantity: 1000, startDate: '', targetDate: '' })) : (setEditingProcess(null), setProcessFormData({ name: '', description: '', inventory: 0, avgTime: 10, requiredAmount: 1 })); }} className="w-full mt-4 py-4 bg-white/5 border border-white/10 border-dashed rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-colors flex justify-center items-center gap-2">
              <Plus className="w-5 h-5 text-orange-500" /> {setupTab === 'projects' ? '새 프로젝트 생성' : '방(공정) 신규 생성하기'}
            </button>
          </div>
          
          {/* Edit Panel */}
          <div className="bg-[#0F1115] rounded-3xl p-6 border border-white/5 shadow-inner">
             <h3 className="font-bold mb-6 flex items-center gap-2 text-orange-400 text-lg"><Edit className="w-5 h-5"/> {setupTab === 'projects' ? (editingProject?'라인 설정 수정':'라인 신규 생성') : (editingProcess?'공정/BOM 수정':'공정 신규 생성')}</h3>
             {setupTab === 'projects' ? (
                <form onSubmit={saveProject} className="space-y-4">
                  <div><label className="text-sm font-bold text-gray-400 mb-2 block">라인 이름</label><input type="text" required value={projectFormData.name} onChange={e=>setProjectFormData({...projectFormData, name: e.target.value})} className="w-full bg-black/50 border border-white/10 p-4 font-bold text-lg text-white rounded-2xl outline-none" placeholder="예: 구미공장 라인 A-1" /></div>
                  <div><label className="text-sm font-bold text-gray-400 mb-2 block">총 목표 납기 수량 (종결 단위)</label><input type="number" min="1" required value={projectFormData.targetQuantity} onChange={e=>setProjectFormData({...projectFormData, targetQuantity: parseInt(e.target.value)})} className="w-full bg-black/50 border border-white/10 p-4 font-bold text-lg text-white rounded-2xl outline-none" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-sm font-bold text-gray-400 mb-2 block">시작 기준일</label><input type="date" required value={projectFormData.startDate} onChange={e=>setProjectFormData({...projectFormData, startDate: e.target.value})} className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-sm outline-none" /></div>
                    <div><label className="text-sm font-bold text-gray-400 mb-2 block">납기 완료 기한일</label><input type="date" required value={projectFormData.targetDate} onChange={e=>setProjectFormData({...projectFormData, targetDate: e.target.value})} className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-sm outline-none focus:border-red-500" /></div>
                  </div>
                  <button type="submit" className="w-full bg-orange-500 text-black font-bold py-4 text-lg rounded-2xl hover:bg-orange-400 mt-8 transition-colors">저장 적용</button>
                </form>
             ) : (
                <form onSubmit={saveProcess} className="space-y-4">
                  <div><label className="text-sm font-bold text-gray-400 mb-2 block">방(공정) 이름 지칭</label><input type="text" required value={processFormData.name} onChange={e=>setProcessFormData({...processFormData, name: e.target.value})} className="w-full bg-black/50 border border-white/10 p-4 font-bold text-lg text-white rounded-2xl outline-none" placeholder="예: 엔진 결합 공정" /></div>
                  <div><label className="text-sm font-bold text-gray-400 mb-2 block">작업 지시 사항 / 설명</label><textarea required value={processFormData.description} onChange={e=>setProcessFormData({...processFormData, description: e.target.value})} className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl outline-none h-24 resize-none"></textarea></div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-3 sm:col-span-1"><label className="text-xs sm:text-sm text-orange-400 font-bold mb-2 block">필요 소요량(EA/장)</label><input type="number" min="1" required value={processFormData.requiredAmount} onChange={e=>setProcessFormData({...processFormData, requiredAmount: parseInt(e.target.value)})} className="w-full bg-orange-500/10 border border-orange-500/30 p-4 rounded-2xl outline-none text-orange-500 font-bold text-xl text-center" /></div>
                    <div className="col-span-3 sm:col-span-1"><label className="text-xs sm:text-sm font-bold text-gray-400 mb-2 block">평균 처리 시간(분)</label><input type="number" min="1" required value={processFormData.avgTime} onChange={e=>setProcessFormData({...processFormData, avgTime: parseInt(e.target.value)})} className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl outline-none text-center text-xl font-bold" /></div>
                    <div className="col-span-3 sm:col-span-1"><label className="text-xs sm:text-sm font-bold text-gray-400 mb-2 block">초기 대기 재고 기초</label><input type="number" min="0" required value={processFormData.inventory} onChange={e=>setProcessFormData({...processFormData, inventory: parseInt(e.target.value)})} className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl outline-none text-center text-xl font-bold" /></div>
                  </div>
                  <button type="submit" className="w-full bg-orange-500 text-black font-bold py-4 text-lg rounded-2xl hover:bg-orange-400 mt-8 shadow-lg shadow-orange-500/20">BOM 및 공정 등록</button>
                </form>
             )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
