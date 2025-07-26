import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import Toast from 'react-native-toast-message';
import { apiService } from '../services/api.service';
import { wsService } from '../services/websocket.service';
import { config } from '../constants/config';
import { ChatMessage } from '@railbird/shared';

const { width, height } = Dimensions.get('window');

interface ChatScreenProps {
  navigation: any;
  route: {
    params?: {
      raceCardId?: string;
      sessionId?: string;
    };
  };
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(route.params?.sessionId);
  const [isConnected, setIsConnected] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    initializeChat();
    
    // Subscribe to WebSocket updates
    const unsubscribeChat = wsService.subscribeToChatMessages((data) => {
      handleNewMessage(data);
    });

    return () => {
      unsubscribeChat();
      if (sessionId) {
        wsService.leaveSession(sessionId);
      }
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const initializeChat = async () => {
    try {
      setIsConnected(wsService.isConnected());

      // Create new session if needed
      if (!sessionId && route.params?.raceCardId) {
        const response = await apiService.createChatSession(route.params.raceCardId);
        if (response.success && response.data) {
          setSessionId(response.data.id);
          wsService.joinSession(response.data.id);
        }
      } else if (sessionId) {
        // Load existing chat history
        const response = await apiService.getChatHistory(sessionId);
        if (response.success && response.data) {
          setMessages(response.data);
        }
        wsService.joinSession(sessionId);
      }

      // Add welcome message if no messages exist
      if (messages.length === 0) {
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          content: route.params?.raceCardId 
            ? "Hey there! I've analyzed your race program and I'm ready to help with your handicapping. What would you like to know about the races?"
            : "Welcome to Railbird! I'm your AI handicapping assistant. Feel free to ask me about horse racing, handicapping strategies, or upload a race program to get started!",
          role: 'assistant',
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }

    } catch (error) {
      console.error('Failed to initialize chat:', error);
      Toast.show({
        type: 'error',
        text1: 'Chat Error',
        text2: 'Failed to initialize chat session',
      });
    }
  };

  const handleNewMessage = (data: any) => {
    if (data.sessionId === sessionId) {
      const newMessage: ChatMessage = {
        id: data.id || Date.now().toString(),
        content: data.content,
        role: data.role,
        timestamp: new Date(data.timestamp),
      };
      setMessages(prev => [...prev, newMessage]);
      setIsTyping(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputText.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await apiService.sendMessage(
        userMessage.content,
        sessionId,
        route.params?.raceCardId
      );

      if (response.success && response.data) {
        const aiMessage: ChatMessage = {
          id: response.data.aiMessage.id,
          content: response.data.aiMessage.content,
          role: 'assistant',
          timestamp: new Date(response.data.aiMessage.timestamp),
        };

        setMessages(prev => [...prev, aiMessage]);
        
        // Update sessionId if it was created
        if (response.data.sessionId && !sessionId) {
          setSessionId(response.data.sessionId);
          wsService.joinSession(response.data.sessionId);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      Toast.show({
        type: 'error',
        text1: 'Message Failed',
        text2: error instanceof Error ? error.message : 'Failed to send message',
      });
    } finally {
      setIsTyping(false);
    }
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';
    const isLast = index === messages.length - 1;

    return (
      <Animatable.View
        key={message.id}
        animation={isLast ? 'fadeInUp' : undefined}
        duration={300}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userMessageBubble : styles.assistantMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.assistantMessageText,
            ]}
          >
            {message.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isUser ? styles.userMessageTime : styles.assistantMessageTime,
            ]}
          >
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </Animatable.View>
    );
  };

  const renderTypingIndicator = () => (
    <Animatable.View
      animation="pulse"
      iterationCount="infinite"
      style={[styles.messageContainer, styles.assistantMessageContainer]}
    >
      <View style={[styles.messageBubble, styles.assistantMessageBubble, styles.typingBubble]}>
        <Text style={styles.typingText}>Railbird is thinking...</Text>
        <View style={styles.typingDots}>
          <View style={styles.typingDot} />
          <View style={styles.typingDot} />
          <View style={styles.typingDot} />
        </View>
      </View>
    </Animatable.View>
  );

  const quickQuestions = [
    "What's the pace scenario?",
    "Who are the favorites?",
    "Any value plays?",
    "Tell me about the 2 horse",
    "What's the track bias?",
  ];

  const renderQuickQuestions = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.quickQuestionsContainer}
      contentContainerStyle={styles.quickQuestionsContent}
    >
      {quickQuestions.map((question, index) => (
        <TouchableOpacity
          key={index}
          style={styles.quickQuestionButton}
          onPress={() => setInputText(question)}
        >
          <Text style={styles.quickQuestionText}>{question}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🏇 Railbird Chat</Text>
          <View style={styles.connectionStatus}>
            <View
              style={[
                styles.connectionDot,
                { backgroundColor: isConnected ? config.colors.success : config.colors.error },
              ]}
            />
            <Text style={styles.connectionText}>
              {isConnected ? 'Connected' : 'Offline'}
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}
          {isTyping && renderTypingIndicator()}
        </ScrollView>

        {messages.length <= 1 && renderQuickQuestions()}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about the races..."
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={config.maxMessageLength}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { opacity: inputText.trim().length > 0 ? 1 : 0.5 },
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isTyping}
          >
            <Text style={styles.sendButtonText}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  backButtonText: {
    fontSize: 24,
    color: config.colors.primary,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 12,
    color: '#6b7280',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messagesContent: {
    paddingVertical: 20,
  },
  messageContainer: {
    marginBottom: 15,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  assistantMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.75,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userMessageBubble: {
    backgroundColor: config.colors.primary,
    borderBottomRightRadius: 6,
  },
  assistantMessageBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typingBubble: {
    paddingVertical: 16,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  userMessageText: {
    color: 'white',
  },
  assistantMessageText: {
    color: '#1f2937',
  },
  messageTime: {
    fontSize: 11,
    opacity: 0.7,
  },
  userMessageTime: {
    color: 'white',
    textAlign: 'right',
  },
  assistantMessageTime: {
    color: '#6b7280',
  },
  typingText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d1d5db',
    marginRight: 4,
  },
  quickQuestionsContainer: {
    paddingVertical: 10,
  },
  quickQuestionsContent: {
    paddingHorizontal: 20,
  },
  quickQuestionButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickQuestionText: {
    fontSize: 14,
    color: config.colors.primary,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
    backgroundColor: '#f9fafb',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: config.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
});