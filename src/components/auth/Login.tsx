import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { useAppContext } from '../../store/AppContext';

export default function Login() {
  const { allWorkers, setCurrentUser, setActiveProjectId } = useAppContext();
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const id = fd.get('loginId') as string;
    const pw = fd.get('password') as string;
    
    const user = allWorkers.find(w => w.loginId === id && w.password === pw);
    if (user) {
      setCurrentUser(user);
      if (user.projectId) setActiveProjectId(user.projectId);
    } else {
      setError('아이디 또는 비밀번호가 일치하지 않습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1115] flex items-center justify-center p-4 selection:bg-orange-500/30">
      <div className="bg-[#1A1D23] p-8 rounded-3xl border border-white/10 w-full max-w-md shadow-2xl relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Zap className="w-10 h-10 text-black fill-current" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-white mb-2">JKP MES <span className="text-orange-500">GO</span></h2>
        <p className="text-gray-400 text-center text-sm mb-8">안전하고 효율적인 권한 기반 현장 관리</p>

        <form onSubmit={handleLogin} className="space-y-4 relative z-10">
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Account ID</label>
            <input name="loginId" type="text" required className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-orange-500 transition-colors" placeholder="ID 입력" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Password</label>
            <input name="password" type="password" required className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-orange-500 transition-colors" placeholder="비밀번호 입력" />
          </div>
          {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
          <button type="submit" className="w-full bg-orange-500 text-black font-bold py-3 mt-4 rounded-xl hover:bg-orange-400 transition-colors shadow-[0_0_20px_rgba(249,115,22,0.3)]">
            게이트웨이 접속
          </button>
        </form>
      </div>
    </div>
  );
}
