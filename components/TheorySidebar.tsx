
import React from 'react';
import { GLOSSARY_ES, GLOSSARY_NL } from '../constants';
import { Language } from '../types';

interface TheorySidebarProps {
  language: Language;
  currentStep: number;
  isOpen: boolean;
  onClose: () => void;
}

const TheorySidebar: React.FC<TheorySidebarProps> = ({ language, currentStep, isOpen, onClose }) => {
  const glossary = language === 'es' ? GLOSSARY_ES : GLOSSARY_NL;
  
  const sections = [
    { title: language === 'es' ? '1. Oración Simple' : '1. Enkelvoudige zin', range: [1, 5] },
    { title: language === 'es' ? '2. Nexos y Unión' : '2. Verbindingswoorden', range: [6, 6] },
    { title: language === 'es' ? '3. Oración Compuesta' : '3. Samengestelde zin', range: [7, 9] },
  ];

  return (
    <div className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out border-l border-gray-200 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="h-full flex flex-col">
        <div className="p-4 bg-[#4D2674] text-white flex justify-between items-center">
          <h3 className="font-bold uppercase tracking-wider text-sm">
            {language === 'es' ? 'Manual de Sintaxis' : 'Syntaxis Handleiding'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {sections.map((section, idx) => {
            const isActive = currentStep >= section.range[0] && currentStep <= section.range[1];
            return (
              <div key={idx} className={`p-3 rounded-xl border transition-all ${isActive ? 'border-[#F58220] bg-orange-50 shadow-sm' : 'border-gray-100 opacity-60'}`}>
                <h4 className={`font-bold text-xs mb-3 uppercase ${isActive ? 'text-[#F58220]' : 'text-gray-400'}`}>
                  {section.title}
                </h4>
                <div className="space-y-3">
                  {Object.entries(glossary).map(([key, value], i) => {
                    // Simple heuristic to show relevant glossary items per section
                    const shouldShow = (idx === 0 && !key.includes('P1') && !key.includes('NEXO')) || 
                                     (idx === 1 && key === 'NEXO') ||
                                     (idx === 2 && (key.includes('P1') || key.includes('O.Compuesta')));
                    
                    if (!shouldShow) return null;

                    return (
                      <div key={i} className="text-xs">
                        <span className="font-black text-[#4D2674] block mb-0.5">{key}</span>
                        <p className="text-gray-600 leading-relaxed">{value}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 text-center italic">
            Metodología Oficial Fontys B2 Taalkunde
          </p>
        </div>
      </div>
    </div>
  );
};

export default TheorySidebar;
