import { Router } from 'express';
import { uploadController } from '../controllers/upload.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { uploadMiddleware, handleUploadError } from '../middleware/upload.middleware';

const router = Router();

// Apply authentication middleware to all upload routes
router.use(authenticateToken);

// Upload race program file
router.post(
  '/race-program',
  uploadMiddleware.single('raceProgram'),
  handleUploadError,
  uploadController.uploadFile
);

// Get upload status
router.get('/status/:fileId', uploadController.getUploadStatus);

// Get user's uploads
router.get('/history', uploadController.getUserUploads);

export default router;