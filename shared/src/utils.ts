import { Horse, Race } from './types';

// Date and Time Utilities
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

// Racing Utilities
export const calculatePaceScenario = (horses: Horse[]): 'fast' | 'moderate' | 'slow' => {
  const speedHorses = horses.filter(horse => 
    horse.pastPerformances.some(pp => pp.speedFigure && pp.speedFigure > 85)
  );
  
  if (speedHorses.length >= 3) return 'fast';
  if (speedHorses.length === 2) return 'moderate';
  return 'slow';
};

export const getFormCycle = (pastPerformances: any[]): 'improving' | 'declining' | 'steady' => {
  if (pastPerformances.length < 3) return 'steady';
  
  const recentRaces = pastPerformances.slice(0, 3);
  const finishes = recentRaces.map(pp => pp.finish);
  
  const improving = finishes[0] < finishes[1] && finishes[1] < finishes[2];
  const declining = finishes[0] > finishes[1] && finishes[1] > finishes[2];
  
  if (improving) return 'improving';
  if (declining) return 'declining';
  return 'steady';
};

export const calculateClassRating = (horse: Horse): number => {
  const recentRaces = horse.pastPerformances.slice(0, 5);
  if (recentRaces.length === 0) return 50;
  
  const avgPurse = recentRaces.reduce((sum, pp) => sum + pp.purse, 0) / recentRaces.length;
  
  // Simple class rating based on average purse (scaled 0-100)
  if (avgPurse >= 100000) return 95;
  if (avgPurse >= 50000) return 85;
  if (avgPurse >= 25000) return 75;
  if (avgPurse >= 10000) return 65;
  return 55;
};

// Odds and Betting Utilities
export const parseOdds = (oddsString: string): number => {
  if (!oddsString) return 0;
  
  // Handle formats like "5-1", "3/2", "7-2"
  if (oddsString.includes('-')) {
    const [num, den] = oddsString.split('-').map(Number);
    return num / den;
  }
  
  if (oddsString.includes('/')) {
    const [num, den] = oddsString.split('/').map(Number);
    return num / den;
  }
  
  return parseFloat(oddsString) || 0;
};

export const oddsToImpliedProbability = (odds: number): number => {
  return 1 / (odds + 1);
};

export const formatOdds = (decimal: number): string => {
  if (decimal < 1) return `1-${Math.round(1/decimal)}`;
  return `${Math.round(decimal)}-1`;
};

// File and Validation Utilities
export const validateFileType = (fileName: string, allowedTypes: string[]): boolean => {
  const extension = fileName.toLowerCase().split('.').pop();
  return allowedTypes.includes(`.${extension}`);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// String Utilities
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength - 3) + '...';
};

// Analysis Utilities
export const extractHorseNumbers = (text: string): number[] => {
  const matches = text.match(/\b(\d{1,2})\s*horse|\bhorse\s*(\d{1,2})\b|\b#(\d{1,2})\b/gi);
  if (!matches) return [];
  
  return matches
    .map(match => {
      const num = match.match(/\d{1,2}/);
      return num ? parseInt(num[0]) : null;
    })
    .filter((num): num is number => num !== null && num >= 1 && num <= 20);
};

export const detectAnalysisType = (text: string): 'pace' | 'form' | 'value' | 'general' => {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('pace') || lowerText.includes('speed') || lowerText.includes('early')) {
    return 'pace';
  }
  
  if (lowerText.includes('form') || lowerText.includes('recent') || lowerText.includes('last race')) {
    return 'form';
  }
  
  if (lowerText.includes('odds') || lowerText.includes('value') || lowerText.includes('price')) {
    return 'value';
  }
  
  return 'general';
};

// Error Handling
export const createError = (message: string, code?: string): Error => {
  const error = new Error(message);
  if (code) (error as any).code = code;
  return error;
};

export const isNetworkError = (error: any): boolean => {
  return error.code === 'NETWORK_ERROR' || 
         error.message?.includes('network') ||
         error.message?.includes('fetch');
};

// Configuration Helpers
export const getApiUrl = (): string => {
  return process.env.REACT_NATIVE_API_URL || 
         process.env.API_URL || 
         'http://localhost:3001';
};

export const getWebSocketUrl = (): string => {
  const apiUrl = getApiUrl();
  return apiUrl.replace('http', 'ws') + '/ws';
};