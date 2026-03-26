import React from 'react';
import { Activity } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppContext } from '../../store/AppContext';
import IntelligentStaffingModal from './IntelligentStaffingModal';
import { FactoryProcess } from '../../types';

export default function ProcessListView() {
  const { processes, workers, activeProject } = useAppContext();
  const [selectedProcess, setSelectedProcess] = React.useState<FactoryProcess | null>(null);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity className="text-orange-500"/> 공정 현황</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {processes.map(p => {
           const ptsWorkers = workers.filter(w => w.currentProcessId === p.id);
           const workingCount = ptsWorkers.filter(w => w.taskState === 'working').length;
           const waitingCount = ptsWorkers.filter(w => w.taskState === 'waiting').length;
           return (
             <div key={p.id} className="bg-[#1A1D23] rounded-3xl p-5 border border-white/5 flex flex-col gap-3 relative hover:border-orange-500/30 transition-all cursor-pointer">
               <div className="flex justify-between items-start">
                 <div>
                   <h3 className="font-bold text-lg">{p.name}</h3>
                   <p className="text-xs text-gray-400 mt-1">{p.description}</p>
                 </div>
                 <div className={cn("px-2 py-1 rounded-full text-[10px] font-bold uppercase", p.status === 'normal' ? 'bg-green-500/20 text-green-500' : p.status === 'delay' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500')}>{p.status}</div>
               </div>

               {/* Progress Tracker replacing Waiting Inventory */}
               <div className="mt-2 text-center">
                 <div className="flex justify-between items-end mb-1 px-1">
                   <p className="text-[10px] font-bold text-gray-400">생산 진척도 (완료 수량)</p>
                   <p className="text-sm font-bold text-white font-mono">{p.inventory.toLocaleString()} / {(activeProject?.targetQuantity || 0).toLocaleString()} <span className="text-[10px] text-gray-500">EA</span></p>
                 </div>
                 <div className="w-full bg-black/50 h-2.5 rounded-full overflow-hidden border border-white/5 relative">
                   <div className={cn("h-full transition-all duration-1000", p.inventory >= (activeProject?.targetQuantity || 1) ? "bg-green-500" : "bg-gradient-to-r from-orange-500 to-yellow-400")} style={{ width: `${Math.min(100, ((p.inventory / (activeProject?.targetQuantity || 1)) * 100))}%` }}></div>
                 </div>
                 {p.inventory >= (activeProject?.targetQuantity || 1) && (
                   <div className="mt-3 text-center bg-green-500/20 text-green-400 font-bold text-sm border border-green-500/30 rounded-xl py-1.5 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                     🎉 목표 수량 달성 완료!
                   </div>
                 )}
               </div>

               <div className="mt-1">
                 <button onClick={() => setSelectedProcess(p)} className="w-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 p-2 rounded-xl transition-colors cursor-pointer group flex justify-between items-center px-4">
                   <p className="text-[11px] text-blue-400 font-bold group-hover:text-blue-300">투입 인력 관리 (클릭)</p>
                   <div className="flex gap-1 justify-center items-center">
                     <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded whitespace-nowrap">진행 {workingCount}명</span>
                     <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded whitespace-nowrap">대기 {waitingCount}명</span>
                   </div>
                 </button>
               </div>
               <div className="mt-2 text-xs flex justify-between px-1">
                 <span className="text-gray-500">단위 소요량: <span className="text-white font-bold">{p.requiredAmount}EA</span></span>
                 <span className="text-gray-500">평균 시간: <span className="text-orange-400 font-bold">{p.avgTime}분</span></span>
               </div>
             </div>
           );
        })}
      </div>
      
      {/* Intelligent Staffing Modal */}
      {selectedProcess && (
        <IntelligentStaffingModal process={selectedProcess} onClose={() => setSelectedProcess(null)} />
      )}
    </div>
  );
}
