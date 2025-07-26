// User and Authentication Types
export interface User {
  id: string;
  email?: string;
  name?: string;
  isGuest: boolean;
  subscriptionTier: 'free' | 'premium' | 'pro';
  createdAt: Date;
  lastActiveAt: Date;
}

// Race Data Types
export interface Horse {
  id: string;
  name: string;
  number: number;
  jockey: string;
  trainer: string;
  weight: number;
  odds?: string;
  morningLine?: string;
  speedFigures: {
    beyer?: number;
    timeform?: number;
    parDRF?: number;
  };
  pastPerformances: PastPerformance[];
  classRating?: number;
  formCycle?: 'improving' | 'declining' | 'steady';
}

export interface PastPerformance {
  date: string;
  track: string;
  distance: string;
  surface: 'dirt' | 'turf' | 'synthetic';
  condition: string;
  finish: number;
  beaten: number;
  time: string;
  speedFigure?: number;
  classLevel: string;
  purse: number;
}

export interface Race {
  id: string;
  number: number;
  track: string;
  date: string;
  distance: string;
  surface: 'dirt' | 'turf' | 'synthetic';
  condition: string;
  purse: number;
  raceType: string;
  horses: Horse[];
  paceScenario?: 'fast' | 'moderate' | 'slow';
  biasIndicators?: string[];
  weatherConditions?: {
    temperature: number;
    conditions: string;
    wind?: string;
  };
}

export interface RaceCard {
  id: string;
  track: string;
  date: string;
  races: Race[];
  uploadedAt: Date;
  userId: string;
  originalFileName: string;
}

// Chat and Analysis Types
export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  raceId?: string;
  metadata?: {
    horseNumbers?: number[];
    analysisType?: 'pace' | 'form' | 'value' | 'general';
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  raceCardId: string;
  raceId?: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  title?: string;
  isActive: boolean;
}

export interface AnalysisInsight {
  type: 'pace' | 'value' | 'form' | 'trainer' | 'jockey' | 'bias';
  confidence: 'high' | 'medium' | 'low';
  summary: string;
  details: string;
  affectedHorses: number[];
}

export interface RaceAnalysis {
  id: string;
  raceId: string;
  insights: AnalysisInsight[];
  topPicks: {
    win: number[];
    place: number[];
    show: number[];
  };
  paceScenario: string;
  keyFactors: string[];
  generatedAt: Date;
}

// OCR and File Processing Types
export interface OCRResult {
  success: boolean;
  text: string;
  confidence: number;
  extractedData?: Partial<RaceCard>;
  errors?: string[];
}

export interface FileUpload {
  id: string;
  userId: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  processedAt?: Date;
  status: 'uploaded' | 'processing' | 'completed' | 'failed';
  ocrResult?: OCRResult;
  raceCardId?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// WebSocket Types
export interface WebSocketMessage {
  type: 'chat' | 'analysis' | 'file_processing' | 'error';
  payload: any;
  sessionId?: string;
  timestamp: Date;
}

// Configuration Types
export interface AppConfig {
  apiUrl: string;
  wsUrl: string;
  openaiApiKey?: string;
  googleCloudVisionKey?: string;
  maxFileSize: number;
  supportedFileTypes: string[];
  features: {
    voiceInput: boolean;
    voiceOutput: boolean;
    realTimeAnalysis: boolean;
    subscriptionRequired: boolean;
  };
}