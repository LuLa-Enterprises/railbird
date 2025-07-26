# 🏇 Railbird - AI-Powered Horse Racing Handicapping Assistant

Railbird is a full-stack mobile application that provides AI-powered conversational handicapping assistance for horse racing. Upload race programs (PDFs from TwinSpires, DRF, DK Horse, etc.) and receive expert-level insights through a natural chat interface.

## ✨ Features

### Core Functionality
- **PDF Upload & OCR Pipeline**: Upload race programs from any device
- **AI-Powered Chat**: Conversational handicapping advice using GPT-4
- **Real-time Analysis**: Live processing updates via WebSocket
- **Cross-Platform**: iOS, Android, and web support via React Native/Expo
- **Voice Input**: Hands-free interaction (optional)

### Racing Features
- **Pace Analysis**: Automated pace scenario detection
- **Form Cycles**: Horse form trend analysis
- **Class Evaluation**: Automatic class rating calculations
- **Value Detection**: Overlay and value play identification
- **Track Bias**: Weather and surface condition analysis

### Technical Features
- **OCR Processing**: Google Cloud Vision + Tesseract fallback
- **Real-time Updates**: WebSocket-powered live updates
- **Offline Support**: Basic functionality without internet
- **PWA Support**: Installable web app
- **Guest Mode**: No registration required

## 🏗️ Architecture

```
railbird-app/
├── shared/          # Shared TypeScript types and utilities
├── backend/         # Node.js API server
├── mobile/          # React Native (Expo) mobile app
├── package.json     # Monorepo configuration
└── README.md
```

### Tech Stack

**Backend:**
- Node.js + Express + TypeScript
- Socket.IO for real-time communication
- OpenAI GPT-4 for AI responses
- Google Cloud Vision + Tesseract for OCR
- Firebase/Firestore for data storage
- JWT authentication

**Mobile App:**
- React Native with Expo
- TypeScript
- React Navigation
- Socket.IO client
- Axios for API calls
- Expo Document Picker & Image Picker

**Shared:**
- TypeScript type definitions
- Common utilities and helpers
- Racing-specific calculations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- OpenAI API key
- (Optional) Google Cloud Vision API key
- (Optional) Firebase project

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd railbird-app
```

2. **Install dependencies:**
```bash
npm run install:all
```

3. **Set up environment variables:**
```bash
cp .env.example backend/.env
```

Edit `backend/.env` with your API keys:
```env
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_CLOUD_API_KEY=your_google_cloud_key (optional)
```

4. **Start development servers:**
```bash
npm run dev
```

This starts both the backend API (port 3001) and mobile app (Expo dev server).

### Development URLs
- **Backend API**: http://localhost:3001
- **Mobile App**: http://localhost:19006 (web) or scan QR code with Expo Go
- **API Health Check**: http://localhost:3001/api/health

## 📱 Mobile App Usage

### Upload Race Program
1. Open the Railbird app
2. Tap "PDF Document" or "Photo/Image"
3. Select your race program file
4. Wait for OCR processing (progress shown)
5. Automatically navigate to chat when complete

### Chat Interface
- Ask natural questions: "What do you think of the 2 horse?"
- Use quick questions for common handicapping queries
- Voice input supported (if enabled)
- Real-time typing indicators
- Message history saved per session

### Example Questions
- "What's the pace scenario in race 5?"
- "Is there a lone speed setup here?"
- "Should I single this favorite or go deeper?"
- "Tell me about any class drops"
- "What's the track bias today?"

## 🔧 API Endpoints

### Upload Endpoints
- `POST /api/upload/race-program` - Upload race program file
- `GET /api/upload/status/:fileId` - Get processing status
- `GET /api/upload/history` - Get upload history

### Chat Endpoints
- `POST /api/chat/message` - Send chat message
- `GET /api/chat/history/:sessionId` - Get chat history
- `POST /api/chat/session` - Create new chat session
- `GET /api/chat/sessions` - Get user sessions
- `DELETE /api/chat/session/:sessionId` - Delete session
- `POST /api/chat/quick-insight` - Get quick insight

### WebSocket Events
- `file_processing` - File processing updates
- `chat_message` - Real-time chat messages
- `analysis_update` - Live analysis updates
- `error` - Error notifications

## 🧠 AI System Prompts

The AI handicapper is trained with expert-level prompts that include:

- **Pace Analysis**: Early speed, pace scenarios, pace handicapping
- **Form Analysis**: Recent performance, form cycles, class changes
- **Value Detection**: Overlay situations, longshot analysis
- **Track Conditions**: Surface bias, weather impact
- **Trainer/Jockey Patterns**: Historical performance data

## 🏃‍♂️ Development

### Project Structure

**Backend (`/backend`):**
```
src/
├── config/          # Configuration management
├── controllers/     # API route handlers
├── middleware/      # Authentication, uploads, etc.
├── services/        # OpenAI, OCR, business logic
├── routes/          # API route definitions
├── utils/           # Utilities and helpers
└── index.ts         # Main server file
```

**Mobile (`/mobile`):**
```
src/
├── components/      # Reusable UI components
├── screens/         # Main app screens
├── navigation/      # Navigation configuration
├── services/        # API and WebSocket services
├── constants/       # App configuration
└── utils/           # Utilities and helpers
```

### Available Scripts

**Root Level:**
- `npm run dev` - Start both backend and mobile
- `npm run build` - Build both projects
- `npm run install:all` - Install all dependencies

**Backend:**
- `npm run dev` - Start development server
- `npm run build` - Build TypeScript
- `npm start` - Start production server

**Mobile:**
- `npm start` - Start Expo development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run in web browser

### Adding New Features

1. **Add shared types** in `/shared/src/types.ts`
2. **Create API endpoints** in `/backend/src/controllers/`
3. **Add mobile screens/components** in `/mobile/src/`
4. **Update navigation** in `/mobile/src/navigation/`

## 🔐 Authentication (Future)

Currently supports guest mode. Planned authentication features:

- Google/Apple OAuth login
- JWT token management
- Subscription tiers (free/premium/pro)
- Usage limits and rate limiting

## 📊 Data Processing

### OCR Pipeline
1. **File Upload**: PDF or image files accepted
2. **Text Extraction**: Google Cloud Vision (primary) or Tesseract (fallback)
3. **Data Parsing**: Extract races, horses, odds, past performances
4. **Validation**: Ensure data quality and completeness
5. **Storage**: Save structured race data

### AI Processing
1. **Context Building**: Race data + user question
2. **Prompt Engineering**: Expert handicapping system prompts
3. **AI Generation**: GPT-4 response with racing insights
4. **Post-processing**: Format and validate response
5. **Real-time Delivery**: WebSocket or HTTP response

## 🚀 Deployment

### Backend Deployment
- Deploy to any Node.js hosting (Heroku, Railway, DigitalOcean)
- Set environment variables
- Configure file storage (local or cloud)
- Set up monitoring and logging

### Mobile App Deployment
- **Development**: Expo Go app
- **Production**: Build with EAS Build
- **Web**: Deploy to Vercel/Netlify
- **App Stores**: Submit via EAS Submit

### Environment Variables
See `.env.example` for all required configuration options.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏇 About Horse Racing Integration

Railbird works with race programs from major platforms:

- **TwinSpires**: PDF race programs
- **Daily Racing Form (DRF)**: Past performance sheets
- **DraftKings Horse**: Race cards and analysis
- **TVG**: Race programs and past performances
- **Other tracks**: Any PDF or image-based race program

### Supported Data Extraction
- Race information (distance, surface, purse, conditions)
- Horse entries (name, number, jockey, trainer, odds)
- Past performance lines
- Speed figures (Beyer, Timeform, etc.)
- Class ratings and form analysis

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Basic file upload and OCR
- ✅ AI chat interface
- ✅ Mobile app (iOS/Android/Web)
- ✅ Real-time processing updates

### Phase 2 (Planned)
- [ ] User authentication and accounts
- [ ] Voice input/output
- [ ] Advanced race analysis features
- [ ] Betting integration
- [ ] Social features (sharing picks)

### Phase 3 (Future)
- [ ] Live odds integration
- [ ] Track bias detection
- [ ] Advanced analytics dashboard
- [ ] Subscription tiers
- [ ] API for third-party integration

---

**Built with ❤️ for horse racing enthusiasts and handicappers**
