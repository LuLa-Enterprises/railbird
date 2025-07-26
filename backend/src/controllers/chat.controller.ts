import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { openaiService } from '../services/openai.service';
import { logger } from '../utils/logger';
import { ApiResponse, ChatMessage, ChatSession } from '@railbird/shared';
import { extractHorseNumbers, detectAnalysisType, sanitizeInput } from '@railbird/shared';

export class ChatController {
  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { message, sessionId, raceId } = req.body;
      const userId = req.user?.id || 'guest';

      if (!message || typeof message !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Message is required'
        } as ApiResponse);
        return;
      }

      const sanitizedMessage = sanitizeInput(message);
      
      // Create user message
      const userMessage: ChatMessage = {
        id: uuidv4(),
        content: sanitizedMessage,
        role: 'user',
        timestamp: new Date(),
        raceId,
        metadata: {
          horseNumbers: extractHorseNumbers(sanitizedMessage),
          analysisType: detectAnalysisType(sanitizedMessage)
        }
      };

      logger.info(`Chat message from user ${userId}: ${sanitizedMessage.substring(0, 100)}...`);

      // Get existing messages for context (you'd fetch from database)
      const existingMessages: ChatMessage[] = [];

      // Get race data if raceId is provided (you'd fetch from database)
      let raceData = null;
      if (raceId) {
        // raceData = await raceService.getRaceById(raceId);
      }

      // Generate AI response
      const aiResponseContent = await openaiService.generateChatResponse(
        [...existingMessages, userMessage],
        raceData,
        `User is asking about race analysis. Focus on handicapping insights.`
      );

      // Create AI message
      const aiMessage: ChatMessage = {
        id: uuidv4(),
        content: aiResponseContent,
        role: 'assistant',
        timestamp: new Date(),
        raceId,
        metadata: {
          horseNumbers: extractHorseNumbers(aiResponseContent),
          analysisType: detectAnalysisType(aiResponseContent)
        }
      };

      // Here you would save both messages to the database
      // await chatService.saveMessages([userMessage, aiMessage], sessionId);

      logger.info(`AI response generated for user ${userId}`);

      res.json({
        success: true,
        data: {
          userMessage,
          aiMessage,
          sessionId: sessionId || uuidv4()
        },
        message: 'Message sent successfully'
      } as ApiResponse);

    } catch (error) {
      logger.error('Chat message error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process message'
      } as ApiResponse);
    }
  }

  async getChatHistory(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.id || 'guest';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      // Here you would fetch from your database
      // const messages = await chatService.getSessionMessages(sessionId, userId, page, limit);

      // Mock response for now
      const messages: ChatMessage[] = [];

      res.json({
        success: true,
        data: messages,
        pagination: {
          page,
          limit,
          total: messages.length,
          totalPages: Math.ceil(messages.length / limit)
        }
      });

    } catch (error) {
      logger.error('Get chat history error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get chat history'
      } as ApiResponse);
    }
  }

  async createChatSession(req: Request, res: Response): Promise<void> {
    try {
      const { raceCardId, raceId, title } = req.body;
      const userId = req.user?.id || 'guest';

      const session: ChatSession = {
        id: uuidv4(),
        userId,
        raceCardId,
        raceId,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        title: title || `Chat Session - ${new Date().toLocaleDateString()}`,
        isActive: true
      };

      // Here you would save to your database
      // await chatService.createSession(session);

      logger.info(`Chat session created: ${session.id} for user ${userId}`);

      res.json({
        success: true,
        data: session,
        message: 'Chat session created successfully'
      } as ApiResponse<ChatSession>);

    } catch (error) {
      logger.error('Create chat session error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create chat session'
      } as ApiResponse);
    }
  }

  async getUserSessions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'guest';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      // Here you would fetch from your database
      // const sessions = await chatService.getUserSessions(userId, page, limit);

      // Mock response for now
      const sessions: ChatSession[] = [];

      res.json({
        success: true,
        data: sessions,
        pagination: {
          page,
          limit,
          total: sessions.length,
          totalPages: Math.ceil(sessions.length / limit)
        }
      });

    } catch (error) {
      logger.error('Get user sessions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user sessions'
      } as ApiResponse);
    }
  }

  async deleteSession(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.id || 'guest';

      // Here you would delete from your database
      // await chatService.deleteSession(sessionId, userId);

      logger.info(`Chat session deleted: ${sessionId} by user ${userId}`);

      res.json({
        success: true,
        message: 'Chat session deleted successfully'
      } as ApiResponse);

    } catch (error) {
      logger.error('Delete session error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete session'
      } as ApiResponse);
    }
  }

  async quickInsight(req: Request, res: Response): Promise<void> {
    try {
      const { question, raceId } = req.body;
      const userId = req.user?.id || 'guest';

      if (!question || !raceId) {
        res.status(400).json({
          success: false,
          error: 'Question and raceId are required'
        } as ApiResponse);
        return;
      }

      // Get race data (you'd fetch from database)
      // const raceData = await raceService.getRaceById(raceId);
      const raceData = null; // Mock for now

      if (!raceData) {
        res.status(404).json({
          success: false,
          error: 'Race not found'
        } as ApiResponse);
        return;
      }

      const insight = await openaiService.generateQuickInsight(question, raceData);

      logger.info(`Quick insight generated for user ${userId}: ${question}`);

      res.json({
        success: true,
        data: {
          question,
          insight,
          raceId,
          timestamp: new Date()
        },
        message: 'Quick insight generated successfully'
      } as ApiResponse);

    } catch (error) {
      logger.error('Quick insight error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate quick insight'
      } as ApiResponse);
    }
  }
}

export const chatController = new ChatController();