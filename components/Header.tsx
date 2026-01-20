
import React, { useState } from 'react';
import type { AnalysisSession } from '../types';
import QRCode from 'react-qr-code';

const SHARE_URL = window.location.href;

const FontysLogo = () => (
  <svg width="40" height="40" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="60" fill="#4D2674" />
    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="40" fontWeight="900" fontFamily="sans-serif">F</text>
    <rect x="70" y="70" width="30" height="30" rx="15" fill="#00A99D" />
  </svg>
);

interface HeaderProps {
  history: AnalysisSession[];
  onRestore: (session: AnalysisSession) => void;
  onGoHome: () => void;
  onTeacherAccess: () => void;
}

const Header: React.FC<HeaderProps> = ({ history, onRestore, onGoHome, onTeacherAccess }) => {
  const [showHistory, setShowHistory] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-[80]">
      <div className="flex items-center space-x-3 cursor-pointer group" onClick={onGoHome}>
        <div className="group-hover:rotate-12 transition-transform duration-300"><FontysLogo /></div>
        <div className="hidden sm:block">
          <h1 className="text-sm font-black text-[#4D2674] uppercase tracking-tighter leading-none">Fontys Spaans</h1>
          <p className="text-[9px] text-[#00A99D] font-bold uppercase tracking-widest mt-0.5 leading-none">Sintaxis Tutor</p>
          <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mt-1 leading-none">Door: Daniel VR</p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button onClick={onGoHome} className="p-2.5 text-slate-400 hover:text-[#4D2674] hover:bg-slate-50 rounded-xl transition-all" title="Inicio">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
        </button>
        
        <button onClick={() => setShowShareModal(true)} className="p-2.5 text-slate-400 hover:text-[#00A99D] hover:bg-slate-50 rounded-xl transition-all" title="Compartir">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
        </button>

        <button onClick={() => setShowHistory(!showHistory)} className="p-2.5 text-slate-400 hover:text-[#F58220] hover:bg-slate-50 rounded-xl transition-all relative" title="Historial">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {history.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-[#F58220] rounded-full ring-2 ring-white"></span>}
        </button>

        <button onClick={onTeacherAccess} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all" title="Panel Docente">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </button>
      </div>

      {/* MODAL COMPARTIR */}
      {showShareModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-xs w-full shadow-2xl animate-scaleIn text-center" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black text-[#4D2674] mb-4">Compartir App</h3>
            <div className="bg-slate-50 p-4 rounded-2xl mb-6 inline-block">
              <QRCode value={SHARE_URL} size={180} />
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">Escanea para abrir en otro dispositivo</p>
            <button onClick={() => setShowShareModal(false)} className="w-full py-3 bg-[#4D2674] text-white font-black rounded-xl">Cerrar</button>
          </div>
        </div>
      )}

      {/* HISTORIAL */}
      {showHistory && (
        <div className="absolute right-6 top-16 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[90] overflow-hidden animate-scaleIn origin-top-right">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mis Análisis</h3>
            <button onClick={() => setShowHistory(false)} className="text-slate-300 hover:text-slate-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
          {history.length === 0 ? (
            <div className="p-8 text-center text-slate-300 text-xs italic">Aún no has analizado oraciones</div>
          ) : (
            <div className="max-h-80 overflow-y-auto no-scrollbar">
              {history.map(s => (
                <button key={s.id} onClick={() => { onRestore(s); setShowHistory(false); }} className="w-full text-left p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group">
                  <p className="text-sm font-bold text-slate-700 truncate group-hover:text-[#4D2674]">"{s.sentence}"</p>
                  <span className="text-[9px] text-slate-300 font-black uppercase mt-1 block">{s.date}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
