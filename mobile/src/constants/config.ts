import Constants from 'expo-constants';

const ENV = {
  dev: {
    apiUrl: 'http://localhost:3001/api',
    wsUrl: 'ws://localhost:3001',
  },
  staging: {
    apiUrl: 'https://api-staging.railbird.app/api',
    wsUrl: 'wss://api-staging.railbird.app',
  },
  prod: {
    apiUrl: 'https://api.railbird.app/api',
    wsUrl: 'wss://api.railbird.app',
  },
};

const getEnvVars = () => {
  if (__DEV__) {
    return ENV.dev;
  } else if (Constants.expoConfig?.releaseChannel === 'staging') {
    return ENV.staging;
  } else {
    return ENV.prod;
  }
};

export const config = {
  ...getEnvVars(),
  
  // App Configuration
  appName: 'Railbird',
  version: '1.0.0',
  
  // File Upload Configuration
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
  
  // Chat Configuration
  maxMessageLength: 1000,
  typingIndicatorDelay: 2000,
  
  // UI Configuration
  animationDuration: 300,
  toastDuration: 3000,
  
  // Feature Flags
  features: {
    voiceInput: true,
    voiceOutput: false,
    darkMode: true,
    notifications: true,
    analytics: false,
  },
  
  // Theme Colors
  colors: {
    primary: '#1E40AF',
    secondary: '#7C3AED',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    info: '#0284C7',
    
    // Racing specific colors
    racing: {
      win: '#22C55E',
      place: '#3B82F6',
      show: '#F59E0B',
      favorite: '#EF4444',
      longshot: '#8B5CF6',
    },
    
    // Surface colors
    surface: {
      dirt: '#8B4513',
      turf: '#22C55E',
      synthetic: '#6366F1',
    },
  },
  
  // API Timeouts
  timeouts: {
    default: 10000,
    upload: 60000,
    chat: 30000,
  },
};

export const endpoints = {
  // Upload endpoints
  uploadRaceProgram: '/upload/race-program',
  getUploadStatus: (fileId: string) => `/upload/status/${fileId}`,
  getUploadHistory: '/upload/history',
  
  // Chat endpoints
  sendMessage: '/chat/message',
  getChatHistory: (sessionId: string) => `/chat/history/${sessionId}`,
  createChatSession: '/chat/session',
  getUserSessions: '/chat/sessions',
  deleteSession: (sessionId: string) => `/chat/session/${sessionId}`,
  quickInsight: '/chat/quick-insight',
  
  // Health check
  health: '/health',
};