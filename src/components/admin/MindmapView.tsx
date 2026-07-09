import React, { useMemo } from 'react';
import { ReactFlow, Controls, Background, Node, Edge, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Network } from 'lucide-react';
import { useAppContext } from '../../store/AppContext';

export default function MindmapView() {
  const { activeProject, processes, workers, allWorkers } = useAppContext();

  const bottleneckInfo = useMemo(() => {
    if (!processes.length) return { process: undefined };
    let maxTime = 0;
    let bp = processes[0];
    processes.forEach(p => {
       const wCount = allWorkers.filter(w => w.currentProcessId === p.id && w.taskState !== 'waiting').length || 1;
       const eTime = (p.avgTime / wCount) * (p.requiredAmount || 1);
       if(eTime > maxTime) { maxTime = eTime; bp = p; }
    });
    return { process: bp };
  }, [processes, allWorkers]);

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  nodes.push({ id: 'project', type: 'default', position: { x: 400, y: 50 }, data: { label: <div className="p-2 font-bold text-lg">{activeProject?.name}</div> }, style: { background: '#1A1D23', color: 'white', border: '2px solid #f97316', borderRadius: '1rem' } });
  
  processes.forEach((p, idx) => {
     const isBottleneck = p.id === bottleneckInfo.process?.id;
     nodes.push({ id: `p-${p.id}`, type: 'default', position: { x: 200 + (idx * 400), y: 200 }, data: { label: <div className="p-2"> <div className="font-bold">{p.name}</div> {isBottleneck && <div className="text-[10px] text-red-500 bg-red-500/10 px-2 py-1 rounded-full mt-1 animate-pulse">🔥 BOTTLENECK</div>} </div> }, style: { background: isBottleneck ? '#450a0a' : '#1A1D23', color: 'white', border: isBottleneck ? '2px solid #ef4444' : '1px solid #374151', borderRadius: '1rem' } });
     edges.push({ id: `e-proj-${p.id}`, source: 'project', target: `p-${p.id}`, animated: true, style: { stroke: '#f97316' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f97316' } });
     
     const pWorkers = workers.filter(w => w.currentProcessId === p.id);
     pWorkers.forEach((w, wIdx) => {
       const isExpert = w.skillLevel >= 9;
       const isWorking = w.taskState === 'working';
       const dotColor = isWorking ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-yellow-500';
       const borderColor = isWorking ? '#22c55e' : '#eab308';
       
       nodes.push({ id: `w-${w.id}`, type: 'default', position: { x: 150 + (idx * 400) + (wIdx * 120), y: 350 }, data: { label: <div className="p-1 flex flex-col items-center relative"> <div className={`w-2.5 h-2.5 ${dotColor} rounded-full absolute top-0 right-0`} /> <img src={w.avatar} className="w-8 h-8 rounded-full mb-1" /> <div className="text-[10px] font-bold">{w.name}</div> <div className="text-[8px] text-gray-500">{isWorking ? '작업 중' : '대기 중'}</div> {isExpert && <div className="text-[8px] text-blue-400 font-bold bg-blue-500/20 px-1 rounded-full mt-1">EXPERT</div>} </div> }, style: { background: '#0F1115', color: 'white', border: `1px solid ${borderColor}`, borderRadius: '0.5rem', width: 100 } });
       edges.push({ id: `e-${p.id}-${w.id}`, source: `p-${p.id}`, target: `w-${w.id}`, style: { stroke: isWorking ? '#22c55e' : '#eab308', strokeWidth: isWorking ? 2 : 1 }, animated: isWorking });
     });
  });

  return (
    <div className="h-[75vh] bg-[#1A1D23] rounded-3xl border border-white/10 overflow-hidden animate-in fade-in slide-in-from-bottom-4 relative">
      <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
        <h3 className="font-bold flex items-center gap-2"><Network className="w-4 h-4 text-orange-500"/> 스마트팩토리 토폴로지 맵</h3>
        <p className="text-xs text-gray-400 mt-1">빨간색 노드는 병목을, 파란 뱃지는 고숙련자를 나타냅니다.</p>
      </div>
      <ReactFlow nodes={nodes} edges={edges} fitView minZoom={0.5}>
        <Background color="#374151" gap={20} />
        <Controls className="bg-black/50 fill-white !border-white/10" />
      </ReactFlow>
    </div>
  );
}
