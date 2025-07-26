import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config, endpoints } from '../constants/config';
import { ApiResponse, ChatMessage, ChatSession, FileUpload } from '@railbird/shared';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: config.timeouts.default,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await AsyncStorage.removeItem('authToken');
          // You might want to redirect to login screen here
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic API methods
  private async get<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post(url, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put(url, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.error || error.response.data?.message || 'Server error';
      return new Error(message);
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your connection.');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred');
    }
  }

  // Upload methods
  async uploadRaceProgram(file: any): Promise<ApiResponse<FileUpload>> {
    try {
      const formData = new FormData();
      formData.append('raceProgram', {
        uri: file.uri,
        type: file.mimeType || 'application/pdf',
        name: file.name || 'race-program.pdf',
      } as any);

      const response = await this.client.post(endpoints.uploadRaceProgram, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: config.timeouts.upload,
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUploadStatus(fileId: string): Promise<ApiResponse<any>> {
    return this.get(endpoints.getUploadStatus(fileId));
  }

  async getUploadHistory(): Promise<ApiResponse<FileUpload[]>> {
    return this.get(endpoints.getUploadHistory);
  }

  // Chat methods
  async sendMessage(message: string, sessionId?: string, raceId?: string): Promise<ApiResponse<any>> {
    return this.post(endpoints.sendMessage, {
      message,
      sessionId,
      raceId,
    });
  }

  async getChatHistory(sessionId: string, page = 1, limit = 50): Promise<ApiResponse<ChatMessage[]>> {
    return this.get(`${endpoints.getChatHistory(sessionId)}?page=${page}&limit=${limit}`);
  }

  async createChatSession(raceCardId: string, raceId?: string, title?: string): Promise<ApiResponse<ChatSession>> {
    return this.post(endpoints.createChatSession, {
      raceCardId,
      raceId,
      title,
    });
  }

  async getUserSessions(page = 1, limit = 20): Promise<ApiResponse<ChatSession[]>> {
    return this.get(`${endpoints.getUserSessions}?page=${page}&limit=${limit}`);
  }

  async deleteSession(sessionId: string): Promise<ApiResponse<void>> {
    return this.delete(endpoints.deleteSession(sessionId));
  }

  async getQuickInsight(question: string, raceId: string): Promise<ApiResponse<any>> {
    return this.post(endpoints.quickInsight, {
      question,
      raceId,
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.get(endpoints.health);
  }

  // Auth methods (for future implementation)
  async login(email: string, password: string): Promise<ApiResponse<any>> {
    // Implement login logic
    throw new Error('Login not implemented yet');
  }

  async register(email: string, password: string, name: string): Promise<ApiResponse<any>> {
    // Implement registration logic
    throw new Error('Registration not implemented yet');
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('authToken');
  }

  // Utility method to check connection
  async checkConnection(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const apiService = new ApiService();