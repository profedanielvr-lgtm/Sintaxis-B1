
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { AnalysisUpdate, Language } from '../types';
import { GLOSSARY_ES, GLOSSARY_NL } from '../constants';

// --- HELPER: Canonicalize Types for Deduplication & Styling ---
const getCanonicalType = (rawType: string): string => {
    if (!rawType) return '';
    const lower = rawType.toLowerCase().trim().replace(/\./g, '');

    if (lower === 'sujeto' || lower === 'sn-sujeto' || lower === 'sn sujeto' || lower === 'sujeto expreso' || lower === 'sujeto paciente' || lower === 'sujeto agente') return 'SN-Sujeto';
    if (lower === 'sujeto omitido' || lower === 'so') return 'SO';
    
    if (lower.includes('predicado') && lower.includes('verbal')) return 'SV-PredicadoVerbal';
    if (lower === 'predicado' || lower === 'sv') return 'SV-PredicadoVerbal'; 
    if (lower.includes('predicado') && lower.includes('nominal')) return 'Predicado Nominal';

    if (lower === 'verbo' || lower === 'v' || lower === 'nucleo' || lower === 'núcleo' || lower === 'nucleo verbal') return 'VERBO';
    if (lower === 'nexo' || lower === 'nx') return 'NEXO';

    if (lower === 'cd' || lower === 'sn-cd' || lower === 'od' || lower === 'objeto directo') return 'SN-CD';
    if (lower === 'ci' || lower === 'sn-ci' || lower === 'oi' || lower === 'objeto indirecto') return 'SN-CI';
    if (lower === 'creg' || lower === 'cregimen' || lower === 'complemento de regimen' || lower === 'complemento regimen') return 'CRég';
    if (lower === 'cag' || lower === 'cagente' || lower === 'complemento agente') return 'C.Ag';
    if (lower === 'cpred' || lower === 'cpredicativo' || lower === 'complemento predicativo') return 'C.Pred';
    if (lower === 'cc' || lower.startsWith('cc ')) return 'CC'; 

    if (lower === 'p1' || lower === 'proposicion 1' || lower === 'oracion 1') return 'P1';
    if (lower === 'p2' || lower === 'proposicion 2' || lower === 'oracion 2') return 'P2';

    return rawType; 
}

const STYLES: { [key: string]: { bg: string; border: string; text: string; shadow: string } } = {
    'SN-Sujeto': { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-800', shadow: 'shadow-blue-200' },
    'SV-PredicadoVerbal': { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-800', shadow: 'shadow-green-200' },
    'Predicado Nominal': { bg: 'bg-emerald-100', border: 'border-emerald-400', text: 'text-emerald-800', shadow: 'shadow-emerald-200' },
    'VERBO': { bg: 'bg-teal-100', border: 'border-teal-400', text: 'text-teal-800', shadow: 'shadow-teal-200' },
    'NP': { bg: 'bg-lime-100', border: 'border-lime-400', text: 'text-lime-800', shadow: 'shadow-lime-200' },
    'NEXO': { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-800', shadow: 'shadow-purple-200' },
    'SN-CD': { bg: 'bg-sky-100', border: 'border-sky-400', text: 'text-sky-800', shadow: 'shadow-sky-200' },
    'SN-CI': { bg: 'bg-rose-100', border: 'border-rose-400', text: 'text-rose-800', shadow: 'shadow-rose-200' },
    'CRég': { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-800', shadow: 'shadow-orange-200' },
    'C.Ag': { bg: 'bg-gray-200', border: 'border-gray-400', text: 'text-gray-800', shadow: 'shadow-gray-300' },
    'C.Pred': { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-800', shadow: 'shadow-yellow-200' },
    'CC': { bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-800', shadow: 'shadow-cyan-100' },
    'P1': { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-800', shadow: 'shadow-indigo-100' },
    'P2': { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-800', shadow: 'shadow-indigo-100' },
    'SO': { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-800', shadow: 'shadow-amber-200' },
    'DEFAULT': { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700', shadow: 'shadow-gray-200' }
};

const getStyles = (type: string) => {
    if (STYLES[type]) return STYLES[type];
    const canonical = getCanonicalType(type);
    if (STYLES[canonical]) return STYLES[canonical];
    if (canonical.startsWith('CC')) return STYLES['CC'];
    return STYLES['DEFAULT'];
};

const getDefinition = (type: string): string | null => {
    if (!type) return null;
    const canonical = getCanonicalType(type);
    const key = canonical.replace(/\s/g, '');
    return GLOSSARY_ES[key] || GLOSSARY_NL[key] || GLOSSARY_ES[canonical] || null;
}

interface TreeNode {
    text: string;
    annotations: AnalysisUpdate[];
    children: TreeNode[];
}

const buildTree = (text: string, annotations: AnalysisUpdate[]): TreeNode => {
    if (!text) return { text: '', annotations: [], children: [] };
    const coveringAnnotations = annotations.filter(a => a.text === text);
    const uniqueCovering = Array.from(new Map(coveringAnnotations.map(a => [a.type, a])).values());
    const filteredCovering = uniqueCovering.filter(a => {
        const t = a.type.toLowerCase();
        return t !== 'oración' && t !== 'oracion' && t !== 'sentence' && t !== 'frase';
    });
    const innerAnnotations = annotations.filter(a => a.text !== text);
    if (innerAnnotations.length === 0) return { text, annotations: filteredCovering, children: [] };
    const validInnerAnnotations = innerAnnotations.filter(a => a.text && text.includes(a.text));
    const topLevelInner = validInnerAnnotations
        .filter(a1 => !validInnerAnnotations.some(a2 => a1.text !== a2.text && a2.text.includes(a1.text)))
        .sort((a, b) => text.indexOf(a.text) - text.indexOf(b.text));
    const children: TreeNode[] = [];
    let currentIndex = 0;
    topLevelInner.forEach(ann => {
        const annIndex = text.indexOf(ann.text, currentIndex);
        if (annIndex === -1) return;
        if (annIndex > currentIndex) children.push({ text: text.substring(currentIndex, annIndex), annotations: [], children: [] });
        const childAnnotations = validInnerAnnotations.filter(a => ann.text.includes(a.text));
        children.push(buildTree(ann.text, childAnnotations));
        currentIndex = annIndex + ann.text.length;
    });
    if (currentIndex < text.length) children.push({ text: text.substring(currentIndex), annotations: [], children: [] });
    return { text, annotations: filteredCovering, children };
};

interface AnnotationWrapperProps {
    annotation: AnalysisUpdate;
    displayLabel: string;
    children: React.ReactNode;
    isHovering: boolean;
    onHover: (text: string | null) => void;
    onClick: (annotation: AnalysisUpdate) => void;
}

const AnnotationWrapper: React.FC<AnnotationWrapperProps> = ({ annotation, displayLabel, children, isHovering, onHover, onClick }) => {
    const styles = getStyles(annotation.type);
    const isActive = isHovering;
    return (
        <div className="flex flex-col items-center mx-1.5 transition-all duration-300">
            <button
                onClick={(e) => { e.stopPropagation(); onClick(annotation); }}
                onMouseEnter={(e) => { e.stopPropagation(); onHover(annotation.text); }}
                onMouseLeave={(e) => { e.stopPropagation(); onHover(null); }}
                className={`
                    relative z-10 px-2.5 py-0.5 mb-1 rounded-full text-[10px] md:text-xs font-black border shadow-sm cursor-pointer transition-all duration-200 whitespace-nowrap outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-400
                    ${styles.bg} ${styles.border} ${styles.text}
                    ${isActive ? 'scale-110 ring-2 ring-offset-1 ring-yellow-400 translate-y-[-2px] ' + styles.shadow : ''}
                `}
            >
                {displayLabel}
            </button>
            <div className={`w-full flex flex-col items-center transition-all duration-300 ${isActive ? 'opacity-100 scale-105' : 'opacity-40'}`}>
                <div className={`h-1.5 w-[2px] ${styles.border.replace('border', 'bg')}`}></div>
                <div className={`w-full h-1 border-t-2 border-l-2 border-r-2 rounded-t-lg ${styles.border}`}></div>
            </div>
            <div className={`flex items-end pt-1.5 transition-all duration-300 ${isActive ? 'bg-yellow-50/70 rounded-lg p-0.5' : ''}`}>
                {children}
            </div>
        </div>
    );
}

interface AnnotatedNodeProps {
    node: TreeNode;
    highlightedText: string | null;
    setHighlightedText: (text: string | null) => void;
    onAnnotationClick: (annotation: AnalysisUpdate) => void;
}

const AnnotatedNode: React.FC<AnnotatedNodeProps> = ({ node, highlightedText, setHighlightedText, onAnnotationClick }) => {
    const { text, annotations, children } = node;
    const uniqueWrappersMap = new Map<string, AnalysisUpdate>();
    const uniqueFooterMap = new Map<string, AnalysisUpdate>();
    annotations.filter(a => a.position !== 'below').forEach(a => {
        const canonical = getCanonicalType(a.type);
        uniqueWrappersMap.set(canonical, a);
    });
    annotations.filter(a => a.position === 'below').forEach(a => {
         const canonical = getCanonicalType(a.type);
         uniqueFooterMap.set(canonical, a);
    });
    const wrappers = Array.from(uniqueWrappersMap.entries()).sort((a, b) => (a[1].level ?? 1) - (b[1].level ?? 1));
    const footerAnnotations = Array.from(uniqueFooterMap.values());
    const isHighlighted = useMemo(() => {
        if (!highlightedText || !text) return false;
        const t1 = highlightedText.trim();
        const t2 = text.trim();
        return t1 === t2 || (t1.includes(t2) && t2.length > 2);
    }, [highlightedText, text]);
    let content: React.ReactNode;
    if (children.length > 0) {
        content = (
            <div className="flex items-end justify-center gap-1.5">
                {children.map((child, i) => (
                    <AnnotatedNode key={i} node={child} highlightedText={highlightedText} setHighlightedText={setHighlightedText} onAnnotationClick={onAnnotationClick} />
                ))}
            </div>
        );
    } else {
        content = (
            <span className={`px-1.5 py-1 text-sm md:text-base text-gray-800 font-bold rounded-md border border-transparent transition-all duration-300 cursor-default ${isHighlighted ? 'bg-yellow-200 border-yellow-400 shadow-md scale-105 z-20' : 'bg-white'}`}>
                {text}
            </span>
        );
    }
    let wrappedContent = content;
    if (wrappers.length > 0) {
        wrappers.forEach(([canonical, ann]) => {
             const isSelfHover = highlightedText === ann.text;
             const displayLabel = STYLES[canonical] ? canonical : ann.type;
             wrappedContent = (
                <AnnotationWrapper key={canonical} annotation={ann} displayLabel={displayLabel} isHovering={isSelfHover} onHover={setHighlightedText} onClick={onAnnotationClick}>
                    {wrappedContent}
                </AnnotationWrapper>
             );
        });
    }
    if (footerAnnotations.length > 0) {
        return (
            <div className="flex flex-col items-center">
                {wrappedContent}
                <div className="mt-6 flex flex-col items-center space-y-2">
                    {footerAnnotations.map((ann, i) => (
                         <button key={i} onClick={() => onAnnotationClick(ann)} className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-t-2 border-gray-200 pt-1.5 px-6 hover:text-purple-600 hover:border-purple-300 transition-all hover:scale-110">
                             {ann.type}
                         </button>
                    ))}
                </div>
            </div>
        )
    }
    return <>{wrappedContent}</>;
};

interface AnalysisViewProps {
  sentence: string;
  analysis: AnalysisUpdate[];
  language: Language | null;
  currentStep: number;
  stepTitle: string;
  onJumpToStep?: (step: number) => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ sentence, analysis, language, currentStep, stepTitle, onJumpToStep }) => {
    const [highlightedText, setHighlightedText] = useState<string | null>(null);
    const [selectedAnnotation, setSelectedAnnotation] = useState<AnalysisUpdate | null>(null);
    const [scale, setScale] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const lastMousePos = useRef({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const totalSteps = 10;
    const isFinished = currentStep > totalSteps;
    const progressPercentage = useMemo(() => Math.min(Math.round(((currentStep - 1) / totalSteps) * 100), 100), [currentStep, totalSteps]);
    const analysisTree = useMemo(() => {
        if (!sentence) return null;
        if (!analysis || analysis.length === 0) return { text: sentence, annotations: [], children: [] };
        const sortedAnalysis = [...analysis].sort((a, b) => b.text.length - a.text.length);
        return buildTree(sentence, sortedAnalysis);
    }, [sentence, analysis]);
    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        if ((e.target as HTMLElement).tagName === 'BUTTON') return;
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        lastMousePos.current = { x: clientX, y: clientY };
    };
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
        if (!isDragging) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
        const deltaX = clientX - lastMousePos.current.x;
        const deltaY = clientY - lastMousePos.current.y;
        setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
        lastMousePos.current = { x: clientX, y: clientY };
    };
    const handleMouseUp = () => setIsDragging(false);
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleMouseMove);
            window.addEventListener('touchend', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleMouseMove);
            window.removeEventListener('touchend', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleMouseMove);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [isDragging]);
    if (!analysisTree) return null;
    return (
        <div className="flex flex-col w-full relative h-full bg-[#FAFAFA]">
            {!isFinished && (
                <div className="mb-4 bg-white p-3 px-6 rounded-2xl border border-purple-100 shadow-lg flex items-center justify-between z-10 mx-4 mt-2 pointer-events-none">
                    <div className="pointer-events-auto flex items-center space-x-6">
                        <div className="flex flex-col">
                            <h4 className="text-[10px] font-black text-[#4D2674] uppercase tracking-[0.2em] mb-0.5">{language === 'es' ? `Progreso` : `Voortgang`}</h4>
                            <p className="text-xs font-black text-slate-700 line-clamp-1">{stepTitle}</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-xl font-black text-[#00A99D] leading-none">{progressPercentage}%</span>
                        </div>
                    </div>
                    <div className="flex-1 max-w-[200px] h-2.5 bg-gray-100 rounded-full overflow-hidden ml-6 relative border border-gray-200">
                        <div className="h-full bg-gradient-to-r from-[#00A99D] to-[#4D2674] transition-all duration-1000 ease-out rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </div>
            )}
            <div className="absolute top-4 right-4 z-30 flex flex-col gap-2 pointer-events-auto">
                <div className="flex flex-col gap-2 bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-gray-200 shadow-xl">
                    <button onClick={() => setScale(s => Math.min(s + 0.1, 2.5))} className="p-2 bg-gray-50 text-gray-700 hover:text-[#4D2674] hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100" title="Acercar"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg></button>
                    <button onClick={() => setScale(s => Math.max(s - 0.1, 0.5))} className="p-2 bg-gray-50 text-gray-700 hover:text-[#4D2674] hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100" title="Alejar"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg></button>
                    <button onClick={() => { setScale(1); setPan({ x: 0, y: 0 }); }} className="p-2 bg-gray-50 text-gray-700 hover:text-[#4D2674] hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-100" title="Restablecer"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
                </div>
            </div>
            {selectedAnnotation && selectedAnnotation.step && onJumpToStep && (
                <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-2xl border border-purple-100 z-50 p-6 max-w-sm w-full animate-scaleIn">
                    <div className="flex justify-between items-start mb-4"><h3 className="text-xl font-black text-[#4D2674]">{selectedAnnotation.type}</h3><button onClick={() => setSelectedAnnotation(null)} className="text-gray-300 hover:text-gray-600 transition-colors p-1"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
                    <p className="text-sm text-gray-500 mb-4 italic font-medium">"{selectedAnnotation.text}"</p>
                    <div className="bg-purple-50 p-4 rounded-2xl text-xs font-bold text-purple-700 mb-6 leading-relaxed border border-purple-100">{getDefinition(selectedAnnotation.type) || (language === 'es' ? 'Elemento sintáctico' : 'Syntactisch element')}</div>
                    <button onClick={() => { if (selectedAnnotation.step) onJumpToStep(selectedAnnotation.step); setSelectedAnnotation(null); }} className="w-full bg-[#4D2674] text-white font-black py-4 px-6 rounded-2xl shadow-xl hover:bg-[#3a1c57] transition-all flex items-center justify-center transform active:scale-95"><svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" /></svg>{language === 'es' ? `Paso ${selectedAnnotation.step}` : `Stap ${selectedAnnotation.step}`}</button>
                </div>
            )}
            {selectedAnnotation && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity" onClick={() => setSelectedAnnotation(null)}></div>}
            <div ref={containerRef} className={`flex-1 w-full relative overflow-hidden select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`} onMouseDown={handleMouseDown} onTouchStart={handleMouseDown}>
                <div id="analysis-export-target" className="absolute top-12 left-1/2 min-w-max transition-transform duration-75 origin-top" style={{ transform: `translate(calc(-50% + ${pan.x}px), ${pan.y}px) scale(${scale})` }}>
                    <AnnotatedNode node={analysisTree} highlightedText={highlightedText} setHighlightedText={setHighlightedText} onAnnotationClick={setSelectedAnnotation} />
                </div>
            </div>
        </div>
    );
};

export default AnalysisView;
