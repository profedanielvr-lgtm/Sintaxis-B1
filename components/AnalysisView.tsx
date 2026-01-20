
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { AnalysisUpdate, Language } from '../types';
import { GLOSSARY_ES, GLOSSARY_NL } from '../constants';

const getCanonicalType = (rawType: string): string => {
    if (!rawType) return '';
    const lower = rawType.toLowerCase().trim().replace(/\./g, '');
    if (lower === 'sujeto' || lower === 'sn-sujeto' || lower === 'sn sujeto' || lower === 'sujeto expreso') return 'SN-Sujeto';
    if (lower === 'sujeto omitido' || lower === 'so') return 'SO';
    if (lower.includes('predicado') && lower.includes('verbal')) return 'SV-PV';
    if (lower === 'verbo' || lower === 'v' || lower === 'nucleo' || lower === 'núcleo') return 'VERBO';
    if (lower === 'nexo' || lower === 'nx') return 'NEXO';
    if (lower === 'cd' || lower === 'sn-cd' || lower === 'objeto directo') return 'SN-CD';
    if (lower === 'ci' || lower === 'sn-ci' || lower === 'objeto indirecto') return 'SN-CI';
    return rawType; 
}

const STYLES: { [key: string]: { bg: string; border: string; text: string; shadow: string } } = {
    'SN-Sujeto': { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-800', shadow: 'shadow-blue-200' },
    'SV-PV': { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-800', shadow: 'shadow-green-200' },
    'VERBO': { bg: 'bg-teal-100', border: 'border-teal-400', text: 'text-teal-800', shadow: 'shadow-teal-200' },
    'NEXO': { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-800', shadow: 'shadow-purple-200' },
    'SN-CD': { bg: 'bg-sky-100', border: 'border-sky-400', text: 'text-sky-800', shadow: 'shadow-sky-200' },
    'SN-CI': { bg: 'bg-rose-100', border: 'border-rose-400', text: 'text-rose-800', shadow: 'shadow-rose-200' },
    'DEFAULT': { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700', shadow: 'shadow-gray-200' }
};

const getStyles = (type: string) => STYLES[getCanonicalType(type)] || STYLES['DEFAULT'];

interface TreeNode { text: string; annotations: AnalysisUpdate[]; children: TreeNode[]; }

const buildTree = (text: string, annotations: AnalysisUpdate[]): TreeNode => {
    if (!text) return { text: '', annotations: [], children: [] };
    const covering = annotations.filter(a => a.text === text);
    const inner = annotations.filter(a => a.text !== text && text.includes(a.text));
    if (inner.length === 0) return { text, annotations: covering, children: [] };
    const topLevelInner = inner
        .filter(a1 => !inner.some(a2 => a1.text !== a2.text && a2.text.includes(a1.text)))
        .sort((a, b) => text.indexOf(a.text) - text.indexOf(b.text));
    const children: TreeNode[] = [];
    let currentIndex = 0;
    topLevelInner.forEach(ann => {
        const annIndex = text.indexOf(ann.text, currentIndex);
        if (annIndex === -1) return;
        if (annIndex > currentIndex) children.push({ text: text.substring(currentIndex, annIndex), annotations: [], children: [] });
        children.push(buildTree(ann.text, inner.filter(a => ann.text.includes(a.text))));
        currentIndex = annIndex + ann.text.length;
    });
    if (currentIndex < text.length) children.push({ text: text.substring(currentIndex), annotations: [], children: [] });
    return { text, annotations: covering, children };
};

const AnnotatedNode: React.FC<{ node: TreeNode; onSelect: (a: AnalysisUpdate) => void; hText: string | null; setH: (t: string | null) => void }> = ({ node, onSelect, hText, setH }) => {
    const isH = hText === node.text;
    const content = node.children.length > 0 ? (
        <div className="flex items-end gap-1.5">
            {node.children.map((c, i) => <AnnotatedNode key={i} node={c} onSelect={onSelect} hText={hText} setH={setH} />)}
        </div>
    ) : (
        <span className={`px-2 py-1 text-sm md:text-base font-bold rounded-md border transition-all duration-200 ${isH ? 'bg-yellow-100 border-yellow-400 scale-105 z-20' : 'bg-white border-transparent'}`}>{node.text}</span>
    );

    return node.annotations.reduce((acc, ann) => {
        const styles = getStyles(ann.type);
        return (
            <div className="flex flex-col items-center mx-1 group">
                <button onClick={() => onSelect(ann)} onMouseEnter={() => setH(ann.text)} onMouseLeave={() => setH(null)} className={`px-2 py-0.5 mb-1 rounded-full text-[9px] font-black border shadow-sm transition-all hover:scale-110 ${styles.bg} ${styles.border} ${styles.text}`}>
                    {ann.type}
                </button>
                <div className={`h-1.5 w-px bg-slate-300 group-hover:bg-purple-400 transition-colors`}></div>
                {acc}
            </div>
        );
    }, content);
};

interface AnalysisViewProps {
  sentence: string;
  analysis: AnalysisUpdate[];
  language: Language | null;
  currentStep?: number;
  stepTitle?: string;
}

// Added currentStep and stepTitle to the component props to resolve type mismatch with ChatInterface
export default function AnalysisView({ sentence, analysis, language, currentStep, stepTitle }: AnalysisViewProps) {
    const [hText, setH] = useState<string | null>(null);
    const [selected, setSelected] = useState<AnalysisUpdate | null>(null);
    const tree = useMemo(() => buildTree(sentence, analysis), [sentence, analysis]);
    const glossary = language === 'nl' ? GLOSSARY_NL : GLOSSARY_ES;

    const definition = useMemo(() => {
        if (!selected) return null;
        const key = getCanonicalType(selected.type);
        return glossary[key] || glossary[selected.type] || (language === 'es' ? "Concepto sintáctico." : "Syntactisch concept.");
    }, [selected, glossary, language]);

    return (
        <div className="w-full h-full bg-[#F8FAFC] flex items-center justify-center overflow-auto p-10 relative">
            <div className="min-w-max">
                <AnnotatedNode node={tree} onSelect={setSelected} hText={hText} setH={setH} />
            </div>

            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn" onClick={() => setSelected(null)}>
                    <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-scaleIn border border-slate-100" onClick={e => e.stopPropagation()}>
                        <div className={`inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase mb-4 border ${getStyles(selected.type).bg} ${getStyles(selected.type).border} ${getStyles(selected.type).text}`}>
                            {selected.type}
                        </div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2 italic">"{selected.text}"</h3>
                        <p className="text-slate-700 font-bold leading-relaxed">{definition}</p>
                        <button onClick={() => setSelected(null)} className="mt-8 w-full py-3 bg-[#4D2674] text-white font-black rounded-xl shadow-lg hover:scale-105 transition-all">ENTENDIDO</button>
                    </div>
                </div>
            )}
        </div>
    );
}
