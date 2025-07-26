import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server Configuration
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration (using Firebase/Firestore)
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  },
  
  // AI Services Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2000'),
  },
  
  // Google Cloud Vision Configuration
  googleCloud: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
    apiKey: process.env.GOOGLE_CLOUD_API_KEY,
  },
  
  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    allowedTypes: ['.pdf', '.jpg', '.jpeg', '.png'],
    uploadPath: process.env.UPLOAD_PATH || './uploads',
  },
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'railbird-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // limit each IP to 100 requests per windowMs
  },
  
  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:19006'],
    credentials: true,
  },
  
  // WebSocket Configuration
  websocket: {
    cors: {
      origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:19006'],
      credentials: true,
    },
  },
  
  // Feature Flags
  features: {
    voiceInput: process.env.FEATURE_VOICE_INPUT === 'true',
    voiceOutput: process.env.FEATURE_VOICE_OUTPUT === 'true',
    realTimeAnalysis: process.env.FEATURE_REALTIME_ANALYSIS === 'true',
    subscriptionRequired: process.env.FEATURE_SUBSCRIPTION_REQUIRED === 'true',
  },
  
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log',
  },
};

// Validation
const requiredEnvVars = ['OPENAI_API_KEY'];

if (config.nodeEnv === 'production') {
  requiredEnvVars.push(
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'JWT_SECRET'
  );
}

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  if (config.nodeEnv === 'production') {
    process.exit(1);
  }
}