
export type GameState = 'SELECT_LANG' | 'ENTER_NAME' | 'UPLOAD_SENTENCE' | 'ANALYZING' | 'TEACHER_DASHBOARD';
export type Language = 'es' | 'nl';

export interface Message {
  sender: 'user' | 'ai' | 'system';
  text: string;
}

export interface AnalysisUpdate {
  type: string; 
  text: string; 
  position?: 'above' | 'below'; 
  level?: number; 
  step?: number; 
}

export interface TutorResponse {
  responseText: string;
  nextStep: number;
  analysisUpdate?: AnalysisUpdate[];
  suggestions?: string[]; 
  sessionSummary?: string; 
}

export interface EvidenceData {
  reflectionCost: string;
  reflectionLearned: string;
  aiSummary: string;
  generatedAt: string;
}

export interface AnalysisSession {
  id: string;
  date: string;
  timestamp: number;
  userName?: string;
  sentence: string;
  language: Language;
  analysisTree: AnalysisUpdate[];
  chatHistory: Message[];
  currentStep: number;
  isComplete: boolean;
  isArchived?: boolean;
  evidence?: EvidenceData; // Registro del PDF generado
}