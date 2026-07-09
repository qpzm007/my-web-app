import React, { useMemo } from 'react';
import { Target } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAppContext } from '../../store/AppContext';

export default function SimulationView() {
  const { activeProject, processes, allWorkers } = useAppContext();

  const bottleneckInfo = useMemo(() => {
    if (!processes.length) return { process: undefined, cycleTime: 0 };
    let maxTime = 0;
    let bp = processes[0];
    processes.forEach(p => {
       const wCount = allWorkers.filter(w => w.currentProcessId === p.id && w.taskState !== 'waiting').length || 1;
       const eTime = (p.avgTime / wCount) * (p.requiredAmount || 1);
       if(eTime > maxTime) { maxTime = eTime; bp = p; }
    });
    return { process: bp, cycleTime: maxTime };
  }, [processes, allWorkers]);

  const simulationData = useMemo(() => {
    if(!activeProject || !bottleneckInfo.process) return null;
    const targetQty = activeProject.targetQuantity || 0;
    const totalMinutes = targetQty * bottleneckInfo.cycleTime;
    const days = totalMinutes / (8 * 60);
    
    const start = activeProject.startDate ? new Date(activeProject.startDate) : new Date();
    const estDate = new Date(start.getTime() + days * 24*60*60*1000);
    
    const targetDate = activeProject.targetDate ? new Date(activeProject.targetDate) : new Date();
    const daysUntilTarget = (targetDate.getTime() - start.getTime()) / (24*60*60*1000);
    const requiredCycleTime = daysUntilTarget * 8 * 60 / targetQty;
    
    let recommendedAdd = 0;
    if (bottleneckInfo.cycleTime > requiredCycleTime) {
        recommendedAdd = Math.ceil((bottleneckInfo.cycleTime / requiredCycleTime) - 1);
    }
    
    return { estDate, delay: estDate > targetDate, recommendedAdd };
  }, [activeProject, bottleneckInfo]);

  if (!simulationData) return null;

  return (
    <div className="bg-gradient-to-br from-[#1A1D23] to-[#0F1115] rounded-3xl p-6 border border-white/10 shadow-xl relative overflow-hidden mb-6">
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
      <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><Target className="text-orange-500"/> AI 납기 시뮬레이터</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
          <p className="text-xs text-gray-400 mb-1">목표 수량 / 기한</p>
          <p className="text-xl font-bold">{activeProject?.targetQuantity?.toLocaleString()} EA</p>
          <p className="text-sm text-gray-400">{activeProject?.targetDate}</p>
        </div>
        <div className={cn("bg-black/40 p-4 rounded-2xl border", simulationData.delay ? "border-red-500/30" : "border-green-500/30")}>
          <p className="text-xs text-gray-400 mb-1">예상 완료일 (바틀넥 기준)</p>
          <p className={cn("text-xl font-bold", simulationData.delay ? "text-red-500" : "text-green-500")}>
            {isNaN(simulationData.estDate.getTime()) ? "계산 불가" : simulationData.estDate.toISOString().split('T')[0]}
          </p>
          <p className="text-sm text-gray-400">{simulationData.delay ? "납기 지연 예상" : "납기 준수 가능"}</p>
        </div>
        <div className="bg-black/40 p-4 rounded-2xl border border-blue-500/30">
          <p className="text-xs text-gray-400 mb-1">AI 인력 재배치 제안</p>
          <p className="text-sm">병목 공정: <span className="font-bold text-orange-400">{bottleneckInfo.process?.name}</span></p>
          {simulationData.recommendedAdd > 0 ? (
            <p className="text-sm text-red-400 mt-1">숙련공 <span className="font-bold text-lg">{simulationData.recommendedAdd}명</span> 추가 투입 필요</p>
          ) : (
            <p className="text-sm text-green-400 mt-1">현재 인력으로 충분합니다</p>
          )}
        </div>
      </div>
    </div>
  );
}
