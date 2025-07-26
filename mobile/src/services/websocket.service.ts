import io, { Socket } from 'socket.io-client';
import { config } from '../constants/config';
import { WebSocketMessage } from '@railbird/shared';

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Function[]> = new Map();

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(config.wsUrl, {
          transports: ['websocket'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectDelay,
        });

        this.socket.on('connect', () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('WebSocket disconnected:', reason);
          this.handleDisconnect();
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(new Error('Failed to connect to WebSocket server'));
          }
        });

        this.socket.on('reconnect', (attemptNumber) => {
          console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
          this.reconnectAttempts = 0;
        });

        // Listen for specific message types
        this.socket.on('file_processing', (data) => {
          this.emit('file_processing', data);
        });

        this.socket.on('chat_message', (data) => {
          this.emit('chat_message', data);
        });

        this.socket.on('analysis_update', (data) => {
          this.emit('analysis_update', data);
        });

        this.socket.on('error', (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Join a specific session room
  joinSession(sessionId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join_session', sessionId);
    }
  }

  // Leave a specific session room
  leaveSession(sessionId: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('leave_session', sessionId);
    }
  }

  // Send a message through WebSocket
  sendMessage(type: string, payload: any, sessionId?: string): void {
    if (this.socket && this.socket.connected) {
      const message: WebSocketMessage = {
        type: type as any,
        payload,
        sessionId,
        timestamp: new Date(),
      };
      
      this.socket.emit('message', message);
    } else {
      console.warn('WebSocket not connected. Message not sent:', { type, payload });
    }
  }

  // Event listener management
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function): void {
    if (!callback) {
      // Remove all listeners for this event
      this.listeners.delete(event);
      return;
    }

    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  private handleDisconnect(): void {
    // Notify listeners about disconnection
    this.emit('disconnect', null);
  }

  // Utility methods for common operations
  subscribeToFileProcessing(callback: (data: any) => void): () => void {
    this.on('file_processing', callback);
    return () => this.off('file_processing', callback);
  }

  subscribeToChatMessages(callback: (data: any) => void): () => void {
    this.on('chat_message', callback);
    return () => this.off('chat_message', callback);
  }

  subscribeToAnalysisUpdates(callback: (data: any) => void): () => void {
    this.on('analysis_update', callback);
    return () => this.off('analysis_update', callback);
  }

  subscribeToErrors(callback: (error: any) => void): () => void {
    this.on('error', callback);
    return () => this.off('error', callback);
  }

  // Reconnection management
  forceReconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket.connect();
    }
  }

  // Get connection status info
  getConnectionInfo(): {
    connected: boolean;
    reconnectAttempts: number;
    maxReconnectAttempts: number;
  } {
    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
    };
  }
}

export const wsService = new WebSocketService();