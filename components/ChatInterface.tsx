
import React, { useRef, useEffect, useState } from 'react';
import type { Message, AnalysisUpdate, Language, EvidenceData } from '../types';
import AnalysisView from './AnalysisView';
import { jsPDF } from "jspdf";
import { generatePortflowSummary } from '../services/geminiService';
import confetti from 'canvas-confetti';

const renderText = (text: string, isUser: boolean) => {
  const formattedText = text
    .replace(/\*\*(.*?)\*\*/g, '<b class="text-[#4D2674] font-black underline decoration-[#00A99D]/30">$1</b>')
    .replace(/\n/g, '<br/>');
    
  return (
    <div 
      className={`text-sm md:text-base leading-relaxed tracking-wide ${isUser ? 'text-white font-bold' : 'text-slate-900 font-medium'}`} 
      dangerouslySetInnerHTML={{ __html: formattedText }} 
    />
  );
};

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';
  
  if (isSystem) return (
    <div className="flex justify-center my-6">
      <div className="bg-slate-100 text-slate-500 text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-widest border border-slate-200">
        {message.text}
      </div>
    </div>
  );

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} my-3 animate-fadeIn px-2`}>
      <div className={`max-w-[90%] md:max-w-[85%] px-6 py-4 rounded-[1.5rem] shadow-sm border transition-all hover:shadow-md ${isUser ? 'bg-[#4D2674] border-[#3a1c57] rounded-tr-none' : 'bg-white border-slate-200 rounded-tl-none'}`}>
        {renderText(message.text, isUser)}
      </div>
    </div>
  );
};

interface ChatInterfaceProps {
  messages: Message[];
  userInput: string;
  setUserInput: (input: string) => void;
  handleSendMessage: (e: React.FormEvent, isHint?: boolean, isHypothesis?: boolean, overrideText?: string) => void;
  isLoading: boolean;
  sentence: string;
  analysisTree: AnalysisUpdate[];
  isComplete: boolean;
  handleReset: () => void;
  language: Language | null;
  showHistory: boolean;
  toggleHistory: () => void;
  stepTitles: string[];
  currentStep: number;
  dynamicSuggestions?: string[];
  onEvidenceGenerated?: (evidence: EvidenceData) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
    messages, userInput, setUserInput, handleSendMessage, isLoading, 
    sentence, analysisTree, isComplete, handleReset, language,
    showHistory, toggleHistory, stepTitles, currentStep,
    dynamicSuggestions = [], onEvidenceGenerated
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showReflection, setShowReflection] = useState(false);
  const [reflectionData, setReflectionData] = useState({ cost: '', learned: '' });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);
  useEffect(() => { if (!isLoading && !isComplete && !showReflection) inputRef.current?.focus(); }, [isLoading, isComplete, showReflection]);

  const finalizeAndDownload = async () => {
      if (!reflectionData.cost || !reflectionData.learned) return;
      setIsGeneratingPDF(true);
      try {
          const summary = await generatePortflowSummary(sentence, reflectionData, language || 'es');
          
          const evidence: EvidenceData = {
              reflectionCost: reflectionData.cost,
              reflectionLearned: reflectionData.learned,
              aiSummary: summary,
              generatedAt: new Date().toLocaleString()
          };
          
          if (onEvidenceGenerated) onEvidenceGenerated(evidence);

          const doc = new jsPDF();
          doc.setFont("helvetica", "bold");
          doc.setFontSize(22);
          doc.setTextColor(77, 38, 116);
          doc.text(language === 'nl' ? "Fontys Syntaxis Bewijs" : "Evidencia Sintáctica Fontys", 20, 30);
          doc.setFontSize(12);
          doc.setTextColor(80);
          doc.text(language === 'nl' ? `Zin: "${sentence}"` : `Oración: "${sentence}"`, 20, 45);
          doc.setDrawColor(0, 169, 157);
          doc.line(20, 52, 190, 52);
          doc.text(language === 'nl' ? "Leerreflectie:" : "Reflexión de aprendizaje:", 20, 65);
          doc.setFont("helvetica", "normal");
          const splitText = doc.splitTextToSize(summary, 170);
          doc.text(splitText, 20, 75);
          doc.save(language === 'nl' ? `Syntaxis_Bewijs.pdf` : `Evidencia_Sintaxis.pdf`);
          
          setShowReflection(false);
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.7 } });
      } catch (e) {
          alert(language === 'nl' ? "Fout bij het genereren van de PDF." : "Error generando el PDF.");
      } finally {
          setIsGeneratingPDF(false);
      }
  };

  const isNL = language === 'nl';

  return (
    <div className="flex flex-col md:flex-row h-full bg-[#F1F5F9] relative overflow-hidden">
      {showReflection && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn">
                  <div className="p-10 text-center bg-[#4D2674] text-white">
                      <h3 className="text-2xl font-black mb-2 tracking-tight">{isNL ? 'Bijna klaar' : 'Casi hemos terminado'}</h3>
                      <p className="text-purple-200 text-[10px] font-black uppercase tracking-[0.2em]">{isNL ? 'Leerreflectie' : 'Reflexión de aprendizaje'}</p>
                  </div>
                  <div className="p-8 space-y-6">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{isNL ? 'Wat vond je het moeilijkst?' : '¿Qué me ha costado más?'}</label>
                          <textarea autoFocus value={reflectionData.cost} onChange={e => setReflectionData(prev => ({...prev, cost: e.target.value}))} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#4D2674] outline-none text-sm font-bold resize-none" rows={3} />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{isNL ? 'Wat heb je vandaag geleerd?' : '¿Qué he aprendido hoy?'}</label>
                          <textarea value={reflectionData.learned} onChange={e => setReflectionData(prev => ({...prev, learned: e.target.value}))} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-[#4D2674] outline-none text-sm font-bold resize-none" rows={3} />
                      </div>
                      <div className="flex gap-4 pt-2">
                          <button onClick={() => setShowReflection(false)} className="flex-1 py-4 text-slate-400 font-black hover:bg-slate-50 rounded-2xl transition-all">{isNL ? 'Annuleren' : 'Cancelar'}</button>
                          <button onClick={finalizeAndDownload} disabled={isGeneratingPDF || !reflectionData.cost || !reflectionData.learned} className="flex-[2] py-4 bg-[#F58220] text-white font-black rounded-2xl shadow-xl disabled:opacity-50 flex items-center justify-center uppercase">{isGeneratingPDF ? (isNL ? 'PDF maken...' : 'Creando PDF...') : (isNL ? 'Bewijs genereren' : 'Generar evidencia')}</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <div className="hidden md:flex flex-[3] bg-white border-r border-slate-200 relative overflow-hidden">
          <AnalysisView sentence={sentence} analysis={analysisTree} language={language} currentStep={currentStep} stepTitle={stepTitles[currentStep-1] || (isNL ? "Voltooid" : "Completado")} />
      </div>

      <div className="flex-[2] flex flex-col min-w-0 bg-white z-10 shadow-lg">
          <div className="flex-none bg-white border-b px-8 py-5 flex justify-between items-center">
              <div className="flex flex-col">
                  <span className="text-[10px] font-black text-[#00A99D] uppercase tracking-[0.2em] mb-0.5">{isNL ? 'Huidige Stap' : 'Paso Actual'}</span>
                  <h2 className="text-sm font-black text-[#4D2674] line-clamp-1">{stepTitles[currentStep-1] || (isNL ? "Voltooid" : "Completado")}</h2>
              </div>
              <button onClick={toggleHistory} className="p-2 text-slate-300 hover:text-[#4D2674]"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar space-y-1 bg-[#F8FAFC]">
            {messages.map((msg, idx) => <MessageBubble key={idx} message={msg} />)}
            {isLoading && (
                <div className="flex justify-start my-4 px-2">
                    <div className="bg-white px-6 py-4 rounded-[1.5rem] border border-slate-100 flex items-center space-x-3 shadow-sm">
                        <div className="flex space-x-1.5"><div className="w-1.5 h-1.5 bg-[#4D2674] rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-[#00A99D] rounded-full animate-bounce [animation-delay:-.3s]"></div><div className="w-1.5 h-1.5 bg-[#F58220] rounded-full animate-bounce [animation-delay:-.5s]"></div></div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-2">{isNL ? 'Analyseren...' : 'Analizando...'}</span>
                    </div>
                </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="flex-none p-6 bg-white border-t border-slate-100">
            {isComplete ? (
                <div className="flex flex-col gap-3 animate-scaleIn">
                    <button onClick={() => setShowReflection(true)} className="w-full py-5 bg-[#F58220] text-white font-black rounded-2xl shadow-xl flex items-center justify-center text-sm"><svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>{isNL ? 'BEWIJS DOWNLOADEN' : 'DESCARGAR EVIDENCIA'}</button>
                    <button onClick={handleReset} className="w-full py-4 text-[#4D2674] font-black text-xs uppercase tracking-widest">{isNL ? 'NIEUWE ZIN' : 'NUEVA ORACIÓN'}</button>
                </div>
            ) : (
                <div className="space-y-6">
                    {!isLoading && dynamicSuggestions.length > 0 && (
                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                            {dynamicSuggestions.map((s, i) => (
                                <button key={i} onClick={() => handleSendMessage({preventDefault:()=>{}}as any, false, false, s)} className="whitespace-nowrap px-6 py-3 bg-white text-[#4D2674] font-bold text-xs rounded-xl border border-slate-200 hover:border-[#4D2674] transition-all">{s}</button>
                            ))}
                        </div>
                    )}
                    <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(e); }} className="flex items-center space-x-3 group">
                        <input ref={inputRef} type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder={isNL ? 'Schrijf je antwoord...' : 'Escribe tu respuesta...'} className="flex-1 p-5 bg-slate-50 border-2 border-transparent focus:border-[#4D2674] focus:bg-white rounded-[1.25rem] outline-none font-bold text-sm shadow-inner" disabled={isLoading} />
                        <button type="submit" disabled={isLoading || !userInput.trim()} className="p-5 bg-[#00A99D] text-white rounded-[1.25rem] shadow-xl hover:bg-[#00877A] disabled:opacity-30 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></button>
                    </form>
                </div>
            )}
          </div>
      </div>
    </div>
  );
};

export default ChatInterface;
