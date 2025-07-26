import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all chat routes
router.use(authenticateToken);

// Send a chat message
router.post('/message', chatController.sendMessage);

// Get chat history for a session
router.get('/history/:sessionId', chatController.getChatHistory);

// Create a new chat session
router.post('/session', chatController.createChatSession);

// Get user's chat sessions
router.get('/sessions', chatController.getUserSessions);

// Delete a chat session
router.delete('/session/:sessionId', chatController.deleteSession);

// Get quick insight
router.post('/quick-insight', chatController.quickInsight);

export default router;