import React from 'react';
import { AlertCircle, FileText, BellRing, Flame } from 'lucide-react';
import { useAppContext } from '../../store/AppContext';
import { cn } from '../../lib/utils';

export default function LiveAlertsPanel() {
  const { logs, setLogs, helpSignals, setHelpSignals, allProcesses, projects } = useAppContext();

  const dismissSignal = (id: string) => setHelpSignals(prev => prev.filter(s => s.id !== id));
  const dismissLog = (id: string) => setLogs(prev => prev.filter(l => l.id !== id));

  // Show only recent 5 items for each
  const recentLogs = [...logs].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5);
  const recentSignals = [...helpSignals].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5);

  if (logs.length === 0 && helpSignals.length === 0) return null;

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 w-full animate-in slide-in-from-bottom-8">
      {/* Help Signals Panel */}
      <div className="bg-red-950/20 border border-red-500/30 rounded-3xl p-5 shadow-[0_0_30px_rgba(239,68,68,0.1)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-transparent"></div>
        <h2 className="text-lg font-bold text-red-500 flex items-center gap-2 mb-4">
          <BellRing className="w-5 h-5 animate-pulse" /> 긴급 호출 / 현장 지원 알림
        </h2>
        
        {recentSignals.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">현재 접수된 긴급 호출이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {recentSignals.map(sig => {
              const process = allProcesses.find(p => p.id === sig.processId);
              const processName = process?.name || '알 수 없는 공정';
              const projectName = projects.find(p => p.id === process?.projectId)?.name || '알 수 없는 프로젝트';
              return (
                <div key={sig.id} className="bg-black/40 rounded-2xl p-4 border border-red-500/20 flex gap-4 items-start">
                  <div className="bg-red-500/20 p-2 rounded-full mt-1"><AlertCircle className="w-4 h-4 text-red-500" /></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="text-gray-400 font-bold text-[10px] bg-white/5 py-0.5 px-2 rounded-md">{projectName}</span>
                        <span className="text-red-400 font-bold text-sm bg-red-500/10 px-2 py-0.5 rounded-md uppercase">{processName}</span>
                      </div>
                      <button onClick={() => dismissSignal(sig.id)} className="text-gray-500 hover:text-green-500 transition-colors tooltip" title="해결 완료 처리">
                         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                      </button>
                    </div>
                    <p className="text-white text-sm font-bold flex items-center gap-2">
                       <span className="text-gray-400 font-normal">요청자:</span> {sig.workerName}
                    </p>
                    <p className="text-gray-400 text-xs mt-1 bg-black/50 p-2 rounded-lg border border-white/5">{sig.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Logs / Defect Panel */}
      <div className="bg-[#1A1D23] border border-white/10 rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <h2 className="text-lg font-bold text-gray-300 flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5" /> 실시간 작업 로그 및 불량 보고
        </h2>
        
        {recentLogs.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">최근 기록된 작업 로그가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {recentLogs.map(log => {
              const process = allProcesses.find(p => p.id === log.processId);
              const processName = process?.name || '알 수 없는 공정';
              const projectName = projects.find(p => p.id === process?.projectId)?.name || '알 수 없는 프로젝트';
              const isDefect = log.message.includes('불량');
              return (
                <div key={log.id} className={cn("bg-black/40 rounded-2xl p-4 border flex gap-3 items-center", isDefect ? "border-orange-500/30" : "border-white/5")}>
                  {isDefect ? <Flame className="w-8 h-8 text-orange-500 p-1.5 bg-orange-500/10 rounded-full" /> : <FileText className="w-8 h-8 text-gray-500 p-1.5 bg-gray-500/10 rounded-full" />}
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="text-gray-400 font-bold text-[10px] bg-white/5 py-0.5 px-2 rounded-md">{projectName}</span>
                        <span className="text-gray-300 font-bold text-xs bg-white/10 px-2 py-1 rounded-md mr-2">{processName}</span>
                        <span className="text-[10px] text-gray-500">{log.timestamp}</span>
                      </div>
                      <button onClick={() => dismissLog(log.id)} className="text-gray-500 hover:text-green-500 transition-colors" title="확인 완료">
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                      </button>
                    </div>
                    <p className={cn("text-sm mt-1", isDefect ? "text-orange-400 font-bold" : "text-gray-400")}>{log.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
