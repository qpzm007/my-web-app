import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { X, TrendingUp, AlertTriangle, Award, CheckCircle2, Factory } from 'lucide-react';
import { Worker } from '../../types';
import { useAppContext } from '../../store/AppContext';

interface WorkerPerformanceModalProps {
  worker: Worker;
  onClose: () => void;
}

export default function WorkerPerformanceModal({ worker, onClose }: WorkerPerformanceModalProps) {
  const { allProcesses, projects } = useAppContext();

  // Generate deterministic but dynamic-looking history based on worker skill level and current project
  const performanceData = useMemo(() => {
    const defaultProjId = worker.projectId || projects[0]?.id;
    const historyProcesses = allProcesses.filter(p => p.projectId === defaultProjId).slice(0, 3);
    const projName = projects.find(p => p.id === defaultProjId)?.name || '기본 프로젝트';

    let tier = 'B등급 (평균 수준)';
    let tierColor = 'text-green-500 bg-green-500/10 border-green-500/20';
    if (worker.skillLevel >= 9) {
      tier = 'S등급 (마스터급)';
      tierColor = 'text-purple-400 bg-purple-500/20 border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.3)]';
    } else if (worker.skillLevel >= 7) {
      tier = 'A등급 (우수)';
      tierColor = 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    } else if (worker.skillLevel <= 3) {
      tier = 'C등급 (재교육 권장)';
      tierColor = 'text-red-400 bg-red-500/10 border-red-500/20';
    }

    const avgDefectRate = 5.0; // Fixed factory average defect rate 5%
    const workerDefectRate = Math.max(0.1, (10 - worker.skillLevel) * 1.2).toFixed(1);
    
    const prodMultiplier = worker.skillLevel / 5;
    const prodText = prodMultiplier >= 1 
      ? `평균 대비 +${Math.round((prodMultiplier - 1) * 100)}% 우수` 
      : `평균 대비 ${Math.round((1 - prodMultiplier) * 100)}% 미달`;

    const logs = historyProcesses.map(p => {
      const baseUph = Math.round((60 / p.avgTime) * p.requiredAmount);
      const workerUph = Math.round(baseUph * prodMultiplier);
      
      return {
        id: p.id,
        projectName: projName,
        processName: p.name,
        baseUph,
        workerUph,
        defectRate: workerDefectRate
      };
    });

    return {
      tier,
      tierColor,
      prodText,
      workerDefectRate,
      avgDefectRate,
      logs
    };
  }, [worker, allProcesses, projects]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#1A1D23] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl custom-scrollbar flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-start sticky top-0 bg-[#1A1D23]/95 backdrop-blur z-10">
           <div className="flex items-center gap-4">
             <img src={worker.avatar} alt="avatar" className="w-16 h-16 rounded-full shadow-lg border-2 border-white/10" />
             <div>
               <div className="flex items-center gap-3">
                 <h2 className="text-2xl font-bold text-white">{worker.name}</h2>
                 <span className={`px-3 py-1 rounded-full text-xs font-bold border ${performanceData.tierColor}`}>
                   {performanceData.tier}
                 </span>
               </div>
               <p className="text-sm text-gray-400 mt-1">
                 {worker.department} • <span className="text-orange-400 font-bold">LV.{worker.skillLevel}</span>
               </p>
             </div>
           </div>
           <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
             <X className="w-5 h-5 text-gray-400 hover:text-white" />
           </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
           
           {/* Global KPI Summary */}
           <div className="grid grid-cols-2 gap-4">
             <div className="bg-black/30 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp className="w-16 h-16" /></div>
               <p className="text-xs text-gray-400 font-bold mb-1">종합 생산성 (시간당 생산량)</p>
               <h3 className="text-2xl font-black text-white">{performanceData.prodText}</h3>
               <p className="text-[10px] text-gray-500 mt-2">공장 표준(LV.5) UPH 기준 대비</p>
             </div>
             <div className="bg-black/30 border border-white/5 rounded-2xl p-5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10"><AlertTriangle className="w-16 h-16" /></div>
               <p className="text-xs text-gray-400 font-bold mb-1">종합 자가 불량률 (Defect Rate)</p>
               <div className="flex items-baseline gap-2">
                 <h3 className="text-2xl font-black text-white">{performanceData.workerDefectRate}%</h3>
                 <span className="text-xs text-gray-500 line-through">공장평균 {performanceData.avgDefectRate}%</span>
               </div>
               <p className="text-[10px] text-gray-500 mt-2">낮을수록 정밀 검수 능력 우수</p>
             </div>
           </div>

           {/* History Log */}
           <div>
             <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
               <Factory className="text-orange-500 w-4 h-4" /> 주요 투입 공정 이력 및 성과 상세
             </h3>
             <div className="space-y-3">
               {performanceData.logs.length === 0 && (
                 <div className="text-center py-8 bg-white/5 rounded-2xl text-gray-500 text-sm">기록된 공정 이력이 없습니다.</div>
               )}
               {performanceData.logs.map((log, idx) => (
                 <div key={`${log.id}-${idx}`} className="bg-[#23272F] border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center hover:bg-white/5 transition-colors">
                   <div className="flex-1 w-full relative">
                     <p className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded w-fit mb-1">{log.projectName}</p>
                     <p className="text-white font-bold">{log.processName}</p>
                   </div>
                   
                   <div className="flex gap-6 w-full md:w-auto">
                     <div className="text-left md:text-right">
                       <p className="text-[10px] text-gray-500 font-bold mb-0.5">실제 UPH (시간당 생산)</p>
                       <p className="text-lg font-mono font-bold text-orange-400">
                         {log.workerUph} <span className="text-xs text-gray-500">/ {log.baseUph} (평균)</span>
                       </p>
                     </div>
                     <div className="text-left md:text-right">
                       <p className="text-[10px] text-gray-500 font-bold mb-0.5">공정 내 불량률</p>
                       <p className="text-lg font-mono font-bold text-red-400">{log.defectRate}%</p>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           </div>

           {/* Skill Conclusion */}
           <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-2xl p-5 flex items-start gap-4">
              <Award className="w-8 h-8 text-blue-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-blue-300 mb-1">AI 역량 총평</h4>
                <p className="text-xs text-blue-200/70 leading-relaxed">
                  {worker.skillLevel >= 8 ? '압도적인 생산 속도와 무결점에 가까운 불량 검수 능력을 갖춘 핵심 인재입니다.' : 
                   worker.skillLevel >= 5 ? '표준 생산량을 안정적으로 소화하며, 신뢰할 수 있는 일반 작업 숙련도를 보유하고 있습니다.' :
                   '생산 속도 향상 및 불량률 감축을 위한 집중적인 OJT(사내 직무 교육)와 지속적인 모니터링이 필요합니다.'}
                </p>
              </div>
           </div>

        </div>
      </div>
    </motion.div>
  );
}
