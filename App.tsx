
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import TeacherDashboard from './components/TeacherDashboard';
import { extractTextFromImage, getTutorResponse } from './services/geminiService';
import { ANALYSIS_STEP_TITLES_ES, ANALYSIS_STEP_TITLES_NL, getShuffledPractice } from './constants';
import type { GameState, Language, Message, AnalysisUpdate, AnalysisSession, EvidenceData } from './types';

const TEACHER_PASSWORD = "fontys2025"; // Contraseña de acceso docente

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('SELECT_LANG');
  const [language, setLanguage] = useState<Language | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [sentence, setSentence] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisTree, setAnalysisTree] = useState<AnalysisUpdate[]>([]);
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [history, setHistory] = useState<AnalysisSession[]>([]);
  const [shuffledPractice, setShuffledPractice] = useState(getShuffledPractice('es'));
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authPassword, setAuthPassword] = useState('');

  // Actualizar oraciones de práctica cuando cambia el idioma
  useEffect(() => {
    if (language) {
      setShuffledPractice(getShuffledPractice(language));
    }
  }, [language]);

  // Cargar historial persistente
  useEffect(() => {
    const stored = localStorage.getItem('fontys_syntax_history');
    if (stored) {
      const parsedHistory: AnalysisSession[] = JSON.parse(stored);
      setHistory(parsedHistory);
      
      const lastSession = parsedHistory.sort((a, b) => b.timestamp - a.timestamp)[0];
      if (lastSession && !lastSession.isComplete && Date.now() - lastSession.timestamp < 7200000) {
          restoreSession(lastSession);
      }
    }
  }, []);

  // Guardado automático de alta frecuencia
  useEffect(() => {
    if (!activeSessionId) return;
    setHistory(prev => {
      const updated = prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            userName,
            sentence,
            chatHistory,
            analysisTree,
            currentStep,
            isComplete: currentStep >= 11,
            timestamp: Date.now()
          };
        }
        return s;
      });
      localStorage.setItem('fontys_syntax_history', JSON.stringify(updated));
      return updated;
    });
  }, [chatHistory, analysisTree, currentStep, activeSessionId, userName, sentence]);

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    setGameState('ENTER_NAME');
  };

  const handleNameSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (userName.trim()) setGameState('UPLOAD_SENTENCE');
  };

  const startAnalysis = useCallback((text: string) => {
    const sessionId = `sess_${Date.now()}`;
    setActiveSessionId(sessionId);
    setSentence(text);
    setAnalysisTree([]); 
    setCurrentStep(1); 
    
    const initialMessage: Message = { 
        sender: 'ai', 
        text: language === 'es' ? `¡Hola ${userName}! Analicemos: "${text}".\n\n**¿Entiendes todas las palabras?**` : `Hoi ${userName}! Laten we kijken naar: "${text}".\n\n**Begrijp je elk woord?**` 
    };
    
    setChatHistory([initialMessage]);
    setDynamicSuggestions(language === 'es' ? ['Entiendo todo', 'Tengo dudas'] : ['Ja', 'Nee']);
    
    const newSession: AnalysisSession = {
        id: sessionId, date: new Date().toLocaleString(), timestamp: Date.now(),
        userName, sentence: text, language: language!,
        analysisTree: [], chatHistory: [initialMessage],
        currentStep: 1, isComplete: false
    };
    
    setHistory(prev => [newSession, ...prev]);
    setGameState('ANALYZING');
  }, [language, userName]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const text = await extractTextFromImage(file);
      if (text && text !== "Error.") {
        startAnalysis(text);
      } else {
        alert(language === 'es' ? "No se pudo extraer el texto de la imagen." : "Kon geen tekst uit de afbeelding extraheren.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert(language === 'es' ? "Error al procesar la imagen." : "Fout bij het verwerken van de afbeelding.");
    } finally {
      setIsUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const restoreSession = (session: AnalysisSession) => {
      setLanguage(session.language);
      setUserName(session.userName || '');
      setSentence(session.sentence);
      setAnalysisTree(session.analysisTree);
      setChatHistory(session.chatHistory);
      setCurrentStep(session.currentStep);
      setActiveSessionId(session.id);
      setGameState('ANALYZING');
  };

  const handleEvidenceGenerated = (evidence: EvidenceData) => {
      if (!activeSessionId) return;
      setHistory(prev => {
          const updated = prev.map(s => s.id === activeSessionId ? { ...s, evidence } : s);
          localStorage.setItem('fontys_syntax_history', JSON.stringify(updated));
          return updated;
      });
  };

  const handleSendMessage = async (e: React.FormEvent, isHint: boolean = false, isHypothesis: boolean = false, overrideText?: string) => {
    if (e) e.preventDefault();
    const finalInput = overrideText || userInput;
    if ((!finalInput.trim() && !isHint) || isLoading || !language) return;

    const msgText = finalInput;
    const newChat = [...chatHistory, { sender: 'user', text: msgText } as Message];
    setChatHistory(newChat);
    setUserInput('');
    setIsLoading(true);

    try {
        const response = await getTutorResponse(language, sentence, currentStep, newChat, msgText, userName, analysisTree);
        if (response.analysisUpdate) {
            setAnalysisTree(prev => {
                const map = new Map();
                [...prev, ...response.analysisUpdate!].forEach(u => map.set(`${u.type}|${u.text}`, u));
                return Array.from(map.values());
            });
        }
        setChatHistory(prev => [...prev, { sender: 'ai', text: response.responseText }]);
        setCurrentStep(response.nextStep);
        setDynamicSuggestions(response.suggestions || []);
    } catch (err) {
        setChatHistory(prev => [...prev, { sender: 'system', text: 'Error.' }]);
    } finally {
        setIsLoading(false);
    }
  };

  const checkTeacherAuth = () => {
      setIsAuthModalOpen(true);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (authPassword === TEACHER_PASSWORD) {
          setIsAuthModalOpen(false);
          setAuthPassword('');
          setGameState('TEACHER_DASHBOARD');
      } else {
          alert("Contraseña incorrecta");
          setAuthPassword('');
      }
  };

  return (
    <div className="h-screen flex flex-col font-sans overflow-hidden bg-white">
      <Header history={history} onRestore={restoreSession} onGoHome={() => setGameState('SELECT_LANG')} onTeacherAccess={checkTeacherAuth} />
      
      {isAuthModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
              <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl animate-scaleIn text-center">
                  <div className="w-16 h-16 bg-[#4D2674] rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <h3 className="text-xl font-black text-[#4D2674] mb-2">Acceso Restringido</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-8">Introduzca la contraseña docente</p>
                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                      <input 
                        autoFocus type="password" 
                        value={authPassword} 
                        onChange={e => setAuthPassword(e.target.value)} 
                        placeholder="••••••••" 
                        className="w-full p-5 bg-slate-50 border-2 border-slate-100 focus:border-[#4D2674] rounded-2xl text-center font-black outline-none" 
                      />
                      <div className="flex gap-3 pt-4">
                          <button type="button" onClick={() => setIsAuthModalOpen(false)} className="flex-1 py-4 text-slate-400 font-black">Cancelar</button>
                          <button type="submit" className="flex-[2] py-4 bg-[#4D2674] text-white font-black rounded-2xl shadow-xl">ENTRAR</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      <main className="flex-grow overflow-hidden relative">
          {gameState === 'SELECT_LANG' && (
              <div className="h-full flex flex-col items-center justify-center p-8 animate-fadeIn bg-slate-50">
                  <h2 className="text-3xl font-black text-[#4D2674] mb-8 tracking-tighter">Selecciona tu idioma / Kies je taal</h2>
                  <div className="flex space-x-4">
                      <button onClick={() => handleLanguageSelect('es')} className="px-12 py-6 bg-[#00A99D] text-white font-black rounded-[2rem] shadow-xl hover:scale-105 transition-all">ESPAÑOL</button>
                      <button onClick={() => handleLanguageSelect('nl')} className="px-12 py-6 bg-[#F58220] text-white font-black rounded-[2rem] shadow-xl hover:scale-105 transition-all">NEDERLANDS</button>
                  </div>
              </div>
          )}

          {gameState === 'ENTER_NAME' && (
              <div className="h-full flex flex-col items-center justify-center p-8 animate-fadeIn">
                  <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 max-w-sm w-full text-center">
                      <h2 className="text-2xl font-black text-[#4D2674] mb-8">{language === 'es' ? '¿Cómo te llamas?' : 'Wat is je naam?'}</h2>
                      <form onSubmit={handleNameSubmit} className="space-y-4">
                          <input autoFocus type="text" value={userName} onChange={e => setUserName(e.target.value)} className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-[#4D2674] rounded-2xl text-center font-black text-2xl outline-none" placeholder="..." />
                          <button type="submit" disabled={!userName.trim()} className="w-full py-5 bg-[#4D2674] text-white font-black rounded-2xl shadow-xl hover:bg-[#3a1c57] transition-all">{language === 'es' ? 'EMPEZAR' : 'STARTEN'}</button>
                      </form>
                  </div>
              </div>
          )}

          {gameState === 'UPLOAD_SENTENCE' && (
              <div className="h-full flex flex-col items-center justify-center p-8 overflow-y-auto no-scrollbar animate-fadeIn bg-slate-50/50">
                  <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch pb-20">
                      <div className="flex flex-col gap-6">
                          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden flex-1">
                              <h3 className="text-xl font-black text-[#4D2674] mb-4">{language === 'es' ? 'Sube tu ejercicio' : 'Upload je oefening'}</h3>
                              <p className="text-xs text-slate-400 font-bold mb-6 leading-relaxed">{language === 'es' ? 'Analiza una foto de tu libro o cuaderno.' : 'Analyseer een foto van je boek of schrift.'}</p>
                              <label className={`w-full py-10 flex items-center justify-center bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-3xl cursor-pointer hover:bg-indigo-100 transition-all ${isUploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                  <div className="flex flex-col items-center space-y-3 text-[#4D2674]">
                                      <svg className={`w-10 h-10 ${isUploadingImage ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                      <span className="font-black text-sm">{isUploadingImage ? (language === 'es' ? 'LEYENDO...' : 'LEZEN...') : (language === 'es' ? 'HACER FOTO' : 'FOTO MAKEN')}</span>
                                  </div>
                              </label>
                          </div>
                          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                              <h3 className="text-xl font-black text-slate-700 mb-4">{language === 'es' ? 'Escritura manual' : 'Handmatig typen'}</h3>
                              <form onSubmit={e => { e.preventDefault(); if(sentence) startAnalysis(sentence); }} className="space-y-4">
                                  <textarea autoFocus value={sentence} onChange={e => setSentence(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-[#4D2674] rounded-2xl text-sm font-bold outline-none" placeholder={language === 'es' ? 'Escribe aquí...' : 'Typ hier...'} rows={2} />
                                  <button type="submit" disabled={!sentence.trim()} className="w-full py-4 bg-[#4D2674] text-white font-black rounded-xl shadow-lg transition-all uppercase">{language === 'es' ? 'Analizar' : 'Analyseren'}</button>
                              </form>
                          </div>
                      </div>
                      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 h-full overflow-y-auto no-scrollbar max-h-[600px]">
                          <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-700 flex items-center">
                               <svg className="w-5 h-5 mr-3 text-[#00A99D]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                               {language === 'es' ? 'Práctica Fontys' : 'Fontys Oefening'}
                            </h3>
                            <button onClick={() => { setIsRefreshing(true); setTimeout(() => { setShuffledPractice(getShuffledPractice(language!)); setIsRefreshing(false); }, 400); }} className={`p-2 text-slate-400 hover:text-[#00A99D] transition-all transform ${isRefreshing ? 'rotate-180' : ''}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            </button>
                          </div>
                          <div className={`space-y-6 ${isRefreshing ? 'opacity-30' : 'opacity-100'}`}>
                              {shuffledPractice.map(category => (
                                  <div key={category.id} className="space-y-3">
                                      <h4 className="text-[9px] font-black text-[#00A99D] uppercase tracking-[0.2em] pl-1 border-l-2 border-[#00A99D] ml-1">{category.label}</h4>
                                      <div className="flex flex-col gap-2">
                                          {category.sentences.map((s, idx) => (
                                              <button key={idx} onClick={() => startAnalysis(s)} className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-left text-[11px] font-bold text-slate-600 hover:border-[#4D2674] hover:bg-white transition-all shadow-sm">"{s}"</button>
                                          ))}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {gameState === 'ANALYZING' && (
              <ChatInterface 
                messages={chatHistory} userInput={userInput} setUserInput={setUserInput} handleSendMessage={handleSendMessage} isLoading={isLoading} 
                sentence={sentence} analysisTree={analysisTree} isComplete={currentStep === 11} 
                handleReset={() => setGameState('UPLOAD_SENTENCE')} language={language} 
                showHistory={showHistory} toggleHistory={() => setShowHistory(!showHistory)} 
                stepTitles={language === 'es' ? ANALYSIS_STEP_TITLES_ES : ANALYSIS_STEP_TITLES_NL} 
                currentStep={currentStep} dynamicSuggestions={dynamicSuggestions}
                onEvidenceGenerated={handleEvidenceGenerated}
              />
          )}

          {gameState === 'TEACHER_DASHBOARD' && (
            <TeacherDashboard 
              history={history} 
              onBack={() => setGameState('UPLOAD_SENTENCE')} 
              onClearHistory={() => { if(window.confirm('¿Limpiar todo el historial?')) { localStorage.removeItem('fontys_syntax_history'); setHistory([]); } }} 
              onRestoreSession={restoreSession}
              onArchive={(id) => setHistory(prev => prev.map(s => s.id === id ? { ...s, isArchived: true } : s))}
              onDelete={(id) => setHistory(prev => prev.filter(s => s.id !== id))}
            />
          )}
      </main>
    </div>
  );
};

export default App;
