import { Router } from 'express';
import uploadRoutes from './upload.routes';
import chatRoutes from './chat.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Railbird API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
router.use('/upload', uploadRoutes);
router.use('/chat', chatRoutes);

export default router;