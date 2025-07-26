import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ocrService } from '../services/ocr.service';
import { logger } from '../utils/logger';
import { ApiResponse, FileUpload, OCRResult } from '@railbird/shared';
import { config } from '../config';
import path from 'path';
import fs from 'fs/promises';

export class UploadController {
  async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'No file uploaded'
        } as ApiResponse);
        return;
      }

      const { originalname, filename, size, mimetype } = req.file;
      const userId = req.user?.id || 'guest';

      // Validate file type
      const allowedTypes = config.upload.allowedTypes;
      const fileExtension = path.extname(originalname).toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        await this.cleanupFile(req.file.path);
        res.status(400).json({
          success: false,
          error: `File type ${fileExtension} not supported. Allowed types: ${allowedTypes.join(', ')}`
        } as ApiResponse);
        return;
      }

      // Validate file size
      if (size > config.upload.maxFileSize) {
        await this.cleanupFile(req.file.path);
        res.status(400).json({
          success: false,
          error: `File size too large. Maximum size: ${config.upload.maxFileSize / 1024 / 1024}MB`
        } as ApiResponse);
        return;
      }

      // Create file upload record
      const fileUpload: FileUpload = {
        id: uuidv4(),
        userId,
        originalName: originalname,
        fileSize: size,
        mimeType: mimetype,
        uploadedAt: new Date(),
        status: 'uploaded'
      };

      logger.info(`File uploaded: ${originalname} by user ${userId}`);

      // Start OCR processing asynchronously
      this.processFileAsync(fileUpload, req.file.path, req.io);

      res.json({
        success: true,
        data: fileUpload,
        message: 'File uploaded successfully. Processing started.'
      } as ApiResponse<FileUpload>);

    } catch (error) {
      logger.error('Upload error:', error);
      
      if (req.file) {
        await this.cleanupFile(req.file.path);
      }

      res.status(500).json({
        success: false,
        error: 'Upload failed'
      } as ApiResponse);
    }
  }

  private async processFileAsync(fileUpload: FileUpload, filePath: string, io: any): Promise<void> {
    try {
      // Update status to processing
      fileUpload.status = 'processing';
      
      // Emit status update via WebSocket
      io.emit('file_processing', {
        fileId: fileUpload.id,
        status: 'processing',
        message: 'Starting OCR processing...'
      });

      logger.info(`Starting OCR processing for file: ${fileUpload.originalName}`);

      // Process with OCR
      const ocrResult: OCRResult = await ocrService.processFile(filePath, fileUpload.originalName);
      
      fileUpload.ocrResult = ocrResult;
      fileUpload.processedAt = new Date();

      if (ocrResult.success && ocrResult.extractedData) {
        fileUpload.status = 'completed';
        
        // Create race card if data was extracted
        if (ocrResult.extractedData.races && ocrResult.extractedData.races.length > 0) {
          const raceCardId = uuidv4();
          fileUpload.raceCardId = raceCardId;
          
          // Here you would save the race card to your database
          logger.info(`Race card created: ${raceCardId} with ${ocrResult.extractedData.races.length} races`);
        }

        io.emit('file_processing', {
          fileId: fileUpload.id,
          status: 'completed',
          message: 'File processed successfully',
          raceCardId: fileUpload.raceCardId,
          extractedData: ocrResult.extractedData
        });

        logger.info(`OCR processing completed for file: ${fileUpload.originalName}`);
      } else {
        fileUpload.status = 'failed';
        
        io.emit('file_processing', {
          fileId: fileUpload.id,
          status: 'failed',
          message: 'Failed to extract race data from file',
          errors: ocrResult.errors
        });

        logger.error(`OCR processing failed for file: ${fileUpload.originalName}`, ocrResult.errors);
      }

    } catch (error) {
      logger.error('File processing error:', error);
      
      fileUpload.status = 'failed';
      fileUpload.ocrResult = {
        success: false,
        text: '',
        confidence: 0,
        errors: [error instanceof Error ? error.message : 'Unknown processing error']
      };

      io.emit('file_processing', {
        fileId: fileUpload.id,
        status: 'failed',
        message: 'Processing failed due to an error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      // Clean up uploaded file
      await this.cleanupFile(filePath);
    }
  }

  async getUploadStatus(req: Request, res: Response): Promise<void> {
    try {
      const { fileId } = req.params;
      
      // Here you would fetch from your database
      // For now, return a mock response
      res.json({
        success: true,
        data: {
          id: fileId,
          status: 'completed',
          message: 'File processed successfully'
        }
      } as ApiResponse);

    } catch (error) {
      logger.error('Get upload status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get upload status'
      } as ApiResponse);
    }
  }

  async getUserUploads(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'guest';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Here you would fetch from your database
      // For now, return a mock response
      res.json({
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      });

    } catch (error) {
      logger.error('Get user uploads error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user uploads'
      } as ApiResponse);
    }
  }

  private async cleanupFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      logger.info(`Cleaned up file: ${filePath}`);
    } catch (error) {
      logger.error(`Failed to cleanup file: ${filePath}`, error);
    }
  }
}

export const uploadController = new UploadController();