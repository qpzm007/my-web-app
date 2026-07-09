import React, { useState, useMemo } from 'react';
import { X, Brain, CheckCircle, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppContext } from '../../store/AppContext';
import type { FactoryProcess, Worker } from '../../types';
import { cn } from '../../lib/utils';

interface IntelligentStaffingModalProps {
  process: FactoryProcess;
  onClose: () => void;
}

export default function IntelligentStaffingModal({ process, onClose }: IntelligentStaffingModalProps) {
  const { allWorkers, setAllWorkers, projects, allProcesses } = useAppContext();
  const [assignedQty, setAssignedQty] = useState<Record<string, number>>({});

  const candidateWorkers = useMemo(() => {
    // 1. Find ALL workers globally, no exclusions
    const candidates = allWorkers.filter(w => w.role === 'worker');
    
    // 2. Calculate AI metrics
    const mapped = candidates.map(w => {
      // Base UPH if normal worker (LV.5)
      const baseUPH = (60 / process.avgTime) * process.requiredAmount;
      
      // Skill modifier (LV.10 = 2.0x speed, LV.1 = 0.2x speed)
      const modifier = Math.max(0.2, w.skillLevel / 5);
      const estUPH = Math.round(baseUPH * modifier);
      
      let expTag = '신입/보통';
      if (w.skillLevel >= 9) expTag = '에이스 (S급)';
      else if (w.skillLevel >= 6) expTag = '유경험자';

      // Determine Live Status Text
      let liveStatus = '완전 대기 중 (유휴)';
      let statusColor = 'text-gray-400';
      if (w.currentProcessId) {
        const assignedProc = allProcesses.find(p => p.id === w.currentProcessId)?.name || '알 수 없는 공정';
        if (w.taskState === 'working') {
          liveStatus = `${assignedProc} 진행 중`;
          statusColor = 'text-green-400';
        } else if (w.taskState === 'paused') {
          liveStatus = `${assignedProc} 일시 정지`;
          statusColor = 'text-yellow-500';
        } else {
          liveStatus = `${assignedProc} 배정됨 (대기)`;
          statusColor = 'text-orange-400';
        }
      }

      return { ...w, estUPH, expTag, liveStatus, statusColor };
    });

    // 3. Sort by highest production rate first
    return mapped.sort((a, b) => b.estUPH - a.estUPH);
  }, [allWorkers, process, allProcesses]);

  const handleAssign = (worker: Worker) => {
    const qty = assignedQty[worker.id] || 100;
    
    setAllWorkers(prev => prev.map(w => w.id === worker.id ? {
      ...w,
      projectId: process.projectId,
      currentProcessId: process.id,
      assignedQuantity: qty,
      taskState: 'waiting' // assigned, but waiting for them to press Start
    } : w));
    
    // Auto close if we assigned someone, or keep it open to assign more?
    // Let's keep it open so they can assign multiple people for huge bottlenecks.
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/90 p-4 flex flex-col justify-center items-center backdrop-blur-sm">
      <div className="bg-[#1A1D23] rounded-3xl p-6 border-t border-orange-500/30 w-full max-w-4xl shadow-[0_0_50px_rgba(249,115,22,0.15)] relative flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
           <div>
             <h2 className="text-2xl font-bold flex items-center gap-2 text-orange-500"><Brain className="w-6 h-6"/> 지능형 인재 풀 & 자동 추천</h2>
             <p className="text-gray-400 mt-2 text-sm">타겟 공정: <span className="text-white font-bold">{process.name}</span> <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full ml-1 text-gray-400">{projects.find(p=>p.id===process.projectId)?.name}</span></p>
             <p className="text-xs text-gray-500 mt-1">이 공정의 난이도(단위 소요량 {process.requiredAmount}EA, 평균 {process.avgTime}분)와 전사 인력의 라이브 작업 상태를 조회하여 최적의 인재를 추천합니다.</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6 text-gray-400"/></button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {candidateWorkers.length === 0 ? (
            <div className="text-center py-20 text-gray-500 font-bold border border-white/5 border-dashed rounded-2xl">
              현재 공장 내에 할당을 대기 중인 인력이 없습니다.<br/>모두가 작업 중입니다.
            </div>
          ) : (
             candidateWorkers.map((worker, idx) => (
                <div key={worker.id} className={cn("bg-black/40 border p-4 rounded-2xl flex items-center justify-between transition-all", idx === 0 ? "border-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.1)] bg-orange-500/5" : "border-white/5 hover:border-white/20")}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                     <div className="flex items-center gap-3 w-48">
                        <img src={worker.avatar} alt="avatar" className={cn("w-10 h-10 rounded-full", idx === 0 ? "ring-2 ring-orange-500" : "")} />
                        <div>
                          <p className="font-bold flex items-center gap-1">{worker.name} {idx === 0 && <span className="bg-orange-500 text-black text-[8px] px-1 py-0.5 rounded-full uppercase ml-1">TOP</span>}</p>
                          <p className="text-[10px] text-gray-500">{worker.department}</p>
                        </div>
                     </div>
                     <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-2 w-full text-center sm:border-l border-white/10 sm:pl-4">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">현재 라이브 상태</p>
                          <p className={cn("font-bold text-sm", worker.statusColor)}>{worker.liveStatus}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase">해당 공정 투입 이력</p>
                          <p className={cn("font-bold text-sm", worker.skillLevel >= 9 ? "text-blue-400" : worker.skillLevel>=6 ? "text-green-400" : "text-gray-400")}>{worker.expTag}</p>
                        </div>
                        <div className="col-span-2 lg:col-span-2 bg-black/60 rounded-xl px-2 py-1 flex flex-col justify-center border border-white/5">
                           <p className="text-[10px] text-orange-500/80 uppercase font-bold flex items-center justify-center gap-1"><TrendingUp className="w-3 h-3"/> 평균 생산 실적 (시간당)</p>
                           <p className="font-mono font-bold text-white"><span className="text-xl text-orange-400">{worker.estUPH}</span> <span className="text-xs">U/h</span></p>
                        </div>
                     </div>
                  </div>
                  
                  <div className="flex flex-col items-end border-l border-white/10 pl-4 ml-4 gap-2 w-48">
                     {worker.currentProcessId === process.id ? (
                        <div className="w-full h-full flex items-center justify-center p-4 bg-white/5 rounded-xl border border-white/10">
                          <p className="text-xs text-gray-400 font-bold text-center">현재 이 공정에<br/>소속된 작업자입니다</p>
                        </div>
                     ) : (
                        <>
                           <div className="w-full flex items-center gap-1">
                              <p className="text-[10px] text-gray-500 w-12 text-right">목표량:</p>
                              <input type="number" min="1" value={assignedQty[worker.id] || 100} onChange={e => setAssignedQty({...assignedQty, [worker.id]: parseInt(e.target.value)})} className="flex-1 bg-black/50 border border-white/10 p-1.5 rounded-lg text-white font-mono text-sm text-center outline-none focus:border-orange-500" />
                           </div>
                           <button onClick={() => handleAssign(worker)} className="w-full bg-orange-500 hover:bg-orange-400 text-black text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)]">
                              <CheckCircle className="w-3 h-3" /> 이 공정으로 차출
                           </button>
                        </>
                     )}
                  </div>
                </div>
             ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
