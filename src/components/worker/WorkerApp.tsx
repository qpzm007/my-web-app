import React, { useState } from 'react';
import { Camera, AlertCircle, Play, Pause, CheckSquare, X, Flame, Activity } from 'lucide-react';
import { useAppContext } from '../../store/AppContext';

export default function WorkerApp() {
  const { currentUser, allWorkers, setAllWorkers, allProcesses, setAllProcesses, setHelpSignals, setLogs, setCurrentUser, projects } = useAppContext();
  
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState({ goodQty: 0, defectQty: 0 });
  const [showNewTaskAlarm, setShowNewTaskAlarm] = useState(false);
  const [partialQty, setPartialQty] = useState(0);
  
  // Track previous assignment to detect when a NEW assignment happens
  const [prevProcessId, setPrevProcessId] = useState<string | undefined>(currentUser?.currentProcessId);

  if (!currentUser) return null;
  const me = allWorkers.find(w => w.id === currentUser.id) || currentUser;
  const myProcess = allProcesses.find(p => p.id === me.currentProcessId);
  const myProject = projects.find(p => p.id === myProcess?.projectId);
  const isAssigned = !!myProcess;
  const isWorking = me.taskState === 'working';
  
  // Real-time synchronization checks if the entire process goal is already satisfied globally by coworkers
  const isProcessComplete = isAssigned && myProject && myProcess.inventory >= myProject.targetQuantity;

  React.useEffect(() => {
    // If the worker was unassigned (or had a different task) and now gets a new processId while waiting
    if (me.currentProcessId && me.currentProcessId !== prevProcessId && me.taskState === 'waiting') {
      setShowNewTaskAlarm(true);
      // Try to play a beep system sound (using standard web audio API approach to bypass external file needs)
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'square';
        oscillator.frequency.value = 800; // 800 Hz beep
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 500); // Stop after 0.5s
      } catch (e) {
        console.log("Audio creation failed", e);
      }
    }
    setPrevProcessId(me.currentProcessId);
  }, [me.currentProcessId, prevProcessId, me.taskState]);

  const updateTaskState = (state: 'waiting' | 'working' | 'paused') => {
    setAllWorkers(prev => prev.map(w => w.id === me.id ? { ...w, taskState: state } : w));
  };

  const handleTaskComplete = () => {
    setCompletionData({ goodQty: me.assignedQuantity || 0, defectQty: 0 });
    setShowCompletionModal(true);
  };

  const submitCompletion = (e: React.FormEvent) => {
    e.preventDefault();
    setAllWorkers(prev => prev.map(w => w.id === me.id ? { 
      ...w, 
      taskState: 'waiting', 
      currentProcessId: null, 
      assignedQuantity: null 
    } : w));
    
    // Add the completed Good Quantity strictly to the active process's inventory (completion tracker)
    setAllProcesses(prev => prev.map(p => p.id === me.currentProcessId ? {
      ...p,
      inventory: p.inventory + completionData.goodQty
    } : p));
    
    setLogs(prev => [{
      id: Date.now().toString(),
      type: 'photo',
      message: `[${me.name}] 실적 보고 - 양품: ${completionData.goodQty}개, 불량: ${completionData.defectQty}개`,
      timestamp: new Date().toLocaleTimeString(),
      processId: me.currentProcessId!
    }, ...prev]);
    
    setShowCompletionModal(false);
  };

  const fireEmergency = () => {
    if(confirm("관리자에게 즉시 알림을 보내시겠습니까?")) {
      setHelpSignals(prev => [...prev, { id: Date.now().toString(), processId: me.currentProcessId!, workerName: me.name, message: '현장 지원 요청' }]);
      alert("관리자 호출이 접수되었습니다.");
    }
  };

  const triggerDefect = () => {
    if(confirm("불량 보고창을 여시겠습니까? (카메라 연동)")) {
      setLogs(prev => [{ id: Date.now().toString(), type: 'photo', message: `[${me.name}] 불량 발생 및 현장 사진을 보고했습니다.`, timestamp: new Date().toLocaleTimeString(), processId: me.currentProcessId! }, ...prev]);
    }
  };

  return (
    <div className={`min-h-screen font-sans selection:bg-orange-500/30 flex flex-col transition-colors duration-500 ${isWorking ? 'bg-[#2A1508]' : me.taskState === 'paused' ? 'bg-[#2A2508]' : 'bg-[#0F1115]'}`}>
      <header className="p-4 flex justify-between items-center border-b border-white/10 bg-black/20">
        <div>
          <p className="text-xs text-gray-400">현장 작업자 앱</p>
          <h2 className="font-bold text-white tracking-tight">{me.name} <span className="text-orange-500 ml-1">LV.{me.skillLevel}</span></h2>
        </div>
        <button onClick={() => setCurrentUser(null)} className="text-xs text-gray-500 font-bold px-3 py-1 bg-white/5 rounded-lg hover:bg-white/10">로그아웃</button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
        {!isAssigned ? (
          <div className="space-y-4">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><AlertCircle className="w-10 h-10 text-gray-500" /></div>
            <h2 className="text-2xl font-bold text-white">대기 상태입니다</h2>
            <p className="text-gray-400">관리자의 새로운 작업 지시를 기다려주세요.</p>
          </div>
        ) : (
          <div className="w-full max-w-sm flex flex-col items-center">
            {isWorking && <div className="absolute top-20 text-orange-500 font-bold text-sm tracking-[0.2em] animate-pulse">⚙️ MACHINE ACTIVE</div>}
            
            <div className="bg-black/30 w-full p-6 rounded-3xl border border-white/10 shadow-2xl mb-8">
              <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wide bg-white/10 py-1 px-3 rounded-full w-fit mx-auto">프로젝트: {myProject?.name || '공통'}</p>
              <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">{myProcess.name}</h1>
              <p className="text-gray-400 text-sm">{myProcess.description}</p>
              
              <div className="flex justify-between items-center mt-6 bg-black/50 px-4 py-3 rounded-2xl border border-white/5">
                 <div className="text-left">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">목표 수량</p>
                    <p className="text-2xl font-bold text-orange-500 font-mono">{me.assignedQuantity} <span className="text-sm">EA</span></p>
                 </div>
                 <div className="text-right border-l border-white/10 pl-4">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">1개당 소요량(BOM)</p>
                    <p className="text-xl font-bold text-white font-mono">{myProcess.requiredAmount} <span className="text-sm">EA</span></p>
                 </div>
              </div>
            </div>

            {me.taskState === 'waiting' && <button onClick={() => updateTaskState('working')} className="w-full bg-gradient-to-r from-orange-500 to-orange-400 text-black py-6 rounded-3xl font-bold text-xl shadow-[0_0_40px_rgba(249,115,22,0.4)] flex items-center justify-center gap-3"><Play className="fill-black"/> 작업 시작</button>}
            
            {me.taskState === 'working' && (
              <div className="space-y-4 w-full">
                <button onClick={() => updateTaskState('paused')} className="w-full bg-yellow-500 text-black py-5 rounded-3xl font-bold text-xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(234,179,8,0.3)]"><Pause className="fill-black"/> 일시 정지 (휴식)</button>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={triggerDefect} className="bg-red-500/20 border border-red-500/50 text-red-500 font-bold py-4 rounded-2xl flex flex-col items-center justify-center gap-2"><Flame className="w-6 h-6"/> 불량 보고</button>
                  <button onClick={fireEmergency} className="bg-blue-500/20 border border-blue-500/50 text-blue-400 font-bold py-4 rounded-2xl flex flex-col items-center justify-center gap-2"><AlertCircle className="w-6 h-6"/> 관리자 호출</button>
                </div>
                <button onClick={handleTaskComplete} className="w-full bg-green-500 text-black py-5 rounded-3xl font-bold text-lg mt-4 flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)]"><CheckSquare /> 할당량 작업 완료</button>
              </div>
            )}

            {me.taskState === 'paused' && <button onClick={() => updateTaskState('working')} className="w-full bg-orange-500 text-black py-6 rounded-3xl font-bold text-xl flex items-center justify-center gap-3 animate-bounce shadow-lg"><Play className="fill-black"/> 작업 재개</button>}
          </div>
        )}
      </main>

      {showCompletionModal && (
        <div className="fixed inset-0 z-[60] bg-black/90 p-4 flex flex-col justify-end">
          <div className="bg-[#1A1D23] rounded-t-3xl p-6 border-t border-green-500/30 w-full max-w-lg mx-auto animate-in slide-in-from-bottom-10 space-y-4">
            <div className="flex justify-between">
              <h3 className="text-xl font-bold text-green-500 flex items-center gap-2"><CheckSquare className="w-6 h-6"/> 실적 등록 및 작업 완료</h3>
              <button onClick={() => setShowCompletionModal(false)}><X className="text-gray-500 hover:text-white"/></button>
            </div>
            <p className="text-xs text-gray-400">목표 할당량: {me.assignedQuantity}EA</p>
            <form onSubmit={submitCompletion} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">양품 수량 확인 (기본값 설정됨)</label>
                <input type="number" min="0" required value={completionData.goodQty} onChange={e => setCompletionData({...completionData, goodQty: parseInt(e.target.value)})} className="w-full bg-black/50 border border-green-500/30 rounded-xl p-4 text-green-400 font-bold text-3xl text-center outline-none focus:border-green-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">발생한 불량 수량 (없을 시 0)</label>
                <input type="number" min="0" required value={completionData.defectQty} onChange={e => setCompletionData({...completionData, defectQty: parseInt(e.target.value)})} className="w-full bg-black/50 border border-red-500/30 rounded-xl p-4 text-red-400 font-bold text-3xl text-center outline-none focus:border-red-500 transition-colors" />
              </div>
              <button type="submit" className="w-full py-5 bg-gradient-to-r from-green-500 to-green-600 hover:to-green-500 text-black font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all">수량 확정 및 대기상태 전환</button>
            </form>
          </div>
        </div>
      )}

      {/* New Task Assignment Alarm Modal */}
      {showNewTaskAlarm && myProcess && (
        <div className="fixed inset-0 z-[100] bg-red-900/40 p-4 flex flex-col justify-center items-center backdrop-blur-md">
          <div className="bg-[#1A1D23] rounded-3xl p-8 border-4 border-red-500 w-full max-w-sm mx-auto text-center shadow-[0_0_100px_rgba(239,68,68,0.4)] animate-pulse">
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"><Activity className="w-10 h-10 text-white" /></div>
            <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight uppercase">새로운 작업 지시</h2>
            <p className="text-[10px] bg-white/20 py-1 px-3 rounded-full text-white font-bold mb-3 mx-auto w-fit">{myProject?.name || '공통 프로젝트'}</p>
            <p className="text-xl text-red-200 font-bold mb-6">[{myProcess.name}] 공정 투입 명령 하달</p>
            
            <div className="bg-black/40 rounded-2xl p-4 mb-8 text-left border border-white/10">
              <p className="text-xs text-gray-400 mb-1">지시 사항</p>
              <p className="text-sm text-white mb-4 line-clamp-3">{myProcess.description}</p>
              <div className="flex justify-between items-center border-t border-white/10 pt-4 mt-2 text-sm">
                <span className="text-gray-400 font-bold">할당 목표 수량:</span>
                <span className="text-orange-500 font-bold text-2xl font-mono">{me.assignedQuantity} <span className="text-sm">EA</span></span>
              </div>
            </div>

            <button onClick={() => setShowNewTaskAlarm(false)} className="w-full py-5 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold text-xl rounded-2xl shadow-xl active:scale-95 transition-all">
              지시 확인 및 현장 이동
            </button>
          </div>
        </div>
      )}

      {/* Auto-Recall Overlay (Process 100% Completed) */}
      {isProcessComplete && (
        <div className="fixed inset-0 z-[110] bg-green-950/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in zoom-in-95 duration-500">
          <div className="bg-[#1A1D23] border border-green-500/30 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_100px_rgba(34,197,94,0.3)]">
            <h2 className="text-2xl font-black text-green-400 mb-2">🎉 할당 공정 달성 완료</h2>
            <p className="text-gray-300 text-sm mb-6">
              [{myProject.name}]의 <strong className="text-white">{myProcess?.name}</strong> 공정 누적 완료 수량이<br/>
              프로젝트 전체 목표 수량({myProject.targetQuantity}EA)을 100% 달성했습니다!<br/><br/>
              <strong className="text-red-400 text-base">진행 중인 작업을 즉시 중단하시고<br/>초기 대기조 상태로 복귀하시기 바랍니다.</strong>
            </p>

            <div className="bg-black/40 rounded-2xl p-4 mb-6 text-left border border-white/10">
              <label className="text-xs text-gray-400 mb-2 block">본인이 추가로 작업 완료한 수량 정산 (선택)</label>
              <input type="number" min="0" value={partialQty} onChange={e => setPartialQty(parseInt(e.target.value) || 0)} className="w-full bg-black/50 border border-white/20 rounded-xl p-3 text-white font-bold text-2xl text-center outline-none focus:border-green-500 transition-colors" />
            </div>

            <button onClick={() => {
               if (partialQty > 0) {
                 setAllProcesses(prev => prev.map(p => p.id === me.currentProcessId ? {
                   ...p,
                   inventory: p.inventory + partialQty
                 } : p));
                 setLogs(prev => [{
                   id: Date.now().toString(),
                   type: 'photo',
                   message: `[${me.name}] (강제 종료 전 잔여분 정산) 완료 수량 추가: ${partialQty}개`,
                   timestamp: new Date().toLocaleTimeString(),
                   processId: me.currentProcessId!
                 }, ...prev]);
               }
               
               setAllWorkers(prev => prev.map(w => w.id === me.id ? { 
                 ...w, 
                 taskState: 'waiting', 
                 currentProcessId: null, 
                 assignedQuantity: null 
               } : w));
               
               setPartialQty(0);
            }} className="w-full bg-gradient-to-r from-green-500 to-emerald-400 text-black font-bold py-4 rounded-xl text-lg shadow-xl hover:scale-105 active:scale-95 transition-all">
               잔여 수량 정산 및 대기조 복귀
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
