
import React, { useMemo, useState } from 'react';
import type { AnalysisSession } from '../types';
import { jsPDF } from "jspdf";

interface TeacherDashboardProps {
  history: AnalysisSession[];
  onBack: () => void;
  onClearHistory: () => void;
  onRestoreSession: (session: AnalysisSession) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ history, onBack, onClearHistory, onRestoreSession, onArchive, onDelete }) => {
  const [tab, setTab] = useState<'sessions' | 'evidences'>('sessions');
  const [showArchived, setShowArchived] = useState(false);
  
  const stats = useMemo(() => {
    if (history.length === 0) return null;
    const activeHistory = history.filter(s => !s.isArchived);
    const esCount = activeHistory.filter(s => s.language === 'es').length;
    const totalStepsArr = activeHistory.map(s => s.chatHistory.length);
    const avgInteractions = totalStepsArr.length > 0 ? (totalStepsArr.reduce((a, b) => a + b, 0) / activeHistory.length).toFixed(1) : 0;
    const evidenceCount = history.filter(s => s.evidence).length;

    const stepCounts = new Array(11).fill(0);
    activeHistory.forEach(session => {
      const maxStep = session.currentStep;
      for (let i = 1; i < maxStep; i++) stepCounts[i]++;
    });

    return {
      total: activeHistory.length,
      archived: history.filter(s => s.isArchived).length,
      evidences: evidenceCount,
      avgInteractions,
      stepRetention: stepCounts.slice(1)
    };
  }, [history]);

  const filteredHistory = useMemo(() => {
      return history.filter(s => s.isArchived === showArchived).sort((a, b) => b.timestamp - a.timestamp);
  }, [history, showArchived]);

  const sessionsWithEvidence = useMemo(() => {
      return history.filter(s => s.evidence).sort((a, b) => b.timestamp - a.timestamp);
  }, [history]);

  const recreatePDF = (session: AnalysisSession) => {
      if (!session.evidence) return;
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(77, 38, 116);
      doc.text("Copia Docente - Evidencia Sintáctica", 20, 30);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(`Alumno: ${session.userName} | Fecha: ${session.evidence.generatedAt}`, 20, 38);
      doc.setFontSize(12);
      doc.setTextColor(80);
      doc.text(`Oración: "${session.sentence}"`, 20, 50);
      doc.setDrawColor(0, 169, 157);
      doc.line(20, 55, 190, 55);
      doc.text("Resumen de aprendizaje (IA):", 20, 65);
      doc.setFont("helvetica", "normal");
      const splitText = doc.splitTextToSize(session.evidence.aiSummary, 170);
      doc.text(splitText, 20, 75);
      doc.text("Reflexión del alumno:", 20, 110);
      doc.text(`Dificultad: ${session.evidence.reflectionCost}`, 20, 120);
      doc.text(`Aprendizaje: ${session.evidence.reflectionLearned}`, 20, 135);
      doc.save(`COPIA_DOCENTE_${session.userName}_Sintaxis.pdf`);
  };

  const exportAllData = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `fontys_syntax_backup_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto animate-fadeIn pb-20">
      <div className="bg-slate-900 text-white p-6 shadow-lg flex justify-between items-center sticky top-0 z-20">
        <div>
          <h2 className="text-2xl font-black flex items-center tracking-tight"><svg className="w-8 h-8 mr-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>Supervisión Docente</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Metodología Sintáctica Fontys</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportAllData} className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-xs font-black uppercase transition-all">Exportar Registro</button>
          <button onClick={onBack} className="bg-white text-slate-900 hover:bg-slate-100 px-5 py-2 rounded-xl text-xs font-black uppercase transition-all">Cerrar</button>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200"><p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Activas</p><p className="text-3xl font-black text-slate-900">{stats?.total || 0}</p></div>
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200"><p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Evidencias PDF</p><p className="text-3xl font-black text-emerald-500">{stats?.evidences || 0}</p></div>
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200"><p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Interacciones Media</p><p className="text-3xl font-black text-indigo-600">{stats?.avgInteractions || 0}</p></div>
          <div className="bg-indigo-600 p-6 rounded-[2rem] shadow-xl text-white"><p className="text-indigo-200 text-[9px] font-black uppercase tracking-widest mb-1">Acceso</p><p className="text-xl font-black">Protegido • Fontys</p></div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-8 py-5 bg-slate-50 border-b flex justify-between items-center">
              <div className="flex gap-4">
                  <button onClick={() => setTab('sessions')} className={`text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-full transition-all ${tab === 'sessions' ? 'bg-[#4D2674] text-white shadow-md' : 'text-slate-400'}`}>Sesiones de Análisis</button>
                  <button onClick={() => setTab('evidences')} className={`text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-full transition-all ${tab === 'evidences' ? 'bg-[#4D2674] text-white shadow-md' : 'text-slate-400'}`}>Registro de Evidencias (PDF)</button>
              </div>
          </div>

          {tab === 'sessions' ? (
              <>
                <div className="px-8 py-4 bg-slate-50/50 flex gap-4">
                    <button onClick={() => setShowArchived(false)} className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full border ${!showArchived ? 'bg-white border-slate-300' : 'text-slate-400 border-transparent'}`}>Activas</button>
                    <button onClick={() => setShowArchived(true)} className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full border ${showArchived ? 'bg-white border-slate-300' : 'text-slate-400 border-transparent'}`}>Archivadas</button>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]"><tr><th className="px-8 py-5">Estudiante</th><th className="px-8 py-5">Oración</th><th className="px-8 py-5">Estado</th><th className="px-8 py-5 text-right">Acciones</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                    {filteredHistory.length === 0 ? (<tr><td colSpan={4} className="px-8 py-20 text-center text-slate-300 italic">No hay sesiones</td></tr>) : (
                        filteredHistory.map((session) => (
                            <tr key={session.id} className="hover:bg-slate-50/80 group">
                            <td className="px-8 py-5"><div className="flex flex-col"><span className="text-sm font-black text-[#4D2674]">{session.userName || 'Estudiante'}</span><span className="text-[8px] text-slate-300 font-bold">{session.date}</span></div></td>
                            <td className="px-8 py-5 text-sm font-bold text-slate-600 max-w-xs truncate">"{session.sentence}"</td>
                            <td className="px-8 py-5"><span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase border ${session.isComplete ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{session.isComplete ? 'Completado' : `Paso ${session.currentStep}/10`}</span></td>
                            <td className="px-8 py-5 text-right"><div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onRestoreSession(session)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                                {!session.isArchived && <button onClick={() => onArchive(session.id)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg></button>}
                                <button onClick={() => onDelete(session.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                            </div></td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
              </>
          ) : (
              <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]"><tr><th className="px-8 py-5">Estudiante</th><th className="px-8 py-5">Fecha Generación</th><th className="px-8 py-5">Dificultad Reportada</th><th className="px-8 py-5 text-right">PDF Original</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                  {sessionsWithEvidence.length === 0 ? (<tr><td colSpan={4} className="px-8 py-20 text-center text-slate-300 italic">No se han generado evidencias todavía</td></tr>) : (
                      sessionsWithEvidence.map((session) => (
                          <tr key={session.id} className="hover:bg-emerald-50/30 transition-all">
                              <td className="px-8 py-5"><div className="flex flex-col"><span className="text-sm font-black text-slate-800">{session.userName}</span><span className="text-[9px] text-slate-400 font-bold truncate max-w-[200px]">"{session.sentence}"</span></div></td>
                              <td className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase">{session.evidence?.generatedAt}</td>
                              <td className="px-8 py-5 text-[10px] font-bold text-slate-400 max-w-[200px] truncate italic">"{session.evidence?.reflectionCost}"</td>
                              <td className="px-8 py-5 text-right">
                                  <button onClick={() => recreatePDF(session)} className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-200 transition-all flex items-center justify-center ml-auto"><svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" /></svg>Bajar Copia</button>
                              </td>
                          </tr>
                      ))
                  )}
                  </tbody>
              </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;