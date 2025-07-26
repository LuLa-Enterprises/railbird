import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import Toast from 'react-native-toast-message';
import { apiService } from '../services/api.service';
import { wsService } from '../services/websocket.service';
import { config } from '../constants/config';
import { FileUpload } from '@railbird/shared';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recentUploads, setRecentUploads] = useState<FileUpload[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    initializeServices();
    loadRecentUploads();
  }, []);

  const initializeServices = async () => {
    try {
      // Connect to WebSocket
      await wsService.connect();
      setIsConnected(true);

      // Subscribe to file processing updates
      wsService.subscribeToFileProcessing((data) => {
        handleFileProcessingUpdate(data);
      });

      // Check API connection
      const connected = await apiService.checkConnection();
      if (!connected) {
        Toast.show({
          type: 'error',
          text1: 'Connection Error',
          text2: 'Unable to connect to Railbird servers',
        });
      }
    } catch (error) {
      console.error('Failed to initialize services:', error);
      Toast.show({
        type: 'error',
        text1: 'Connection Error',
        text2: 'Failed to connect to Railbird servers',
      });
    }
  };

  const loadRecentUploads = async () => {
    try {
      const response = await apiService.getUploadHistory();
      if (response.success && response.data) {
        setRecentUploads(response.data.slice(0, 3)); // Show only 3 most recent
      }
    } catch (error) {
      console.error('Failed to load recent uploads:', error);
    }
  };

  const handleFileProcessingUpdate = (data: any) => {
    const { fileId, status, message, raceCardId } = data;
    
    if (status === 'completed' && raceCardId) {
      setIsUploading(false);
      setUploadProgress(0);
      
      Toast.show({
        type: 'success',
        text1: 'Processing Complete!',
        text2: 'Your race program is ready for analysis',
      });

      // Navigate to chat screen with the race card
      navigation.navigate('Chat', { raceCardId });
    } else if (status === 'failed') {
      setIsUploading(false);
      setUploadProgress(0);
      
      Toast.show({
        type: 'error',
        text1: 'Processing Failed',
        text2: message || 'Unable to process your race program',
      });
    } else if (status === 'processing') {
      setUploadProgress(50);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadFile(result.assets[0]);
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to select document',
      });
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Please grant camera roll permissions to upload images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadFile(result.assets[0]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to select image',
      });
    }
  };

  const uploadFile = async (file: any) => {
    try {
      setIsUploading(true);
      setUploadProgress(25);

      const response = await apiService.uploadRaceProgram(file);
      
      if (response.success) {
        setUploadProgress(75);
        Toast.show({
          type: 'success',
          text1: 'Upload Successful',
          text2: 'Processing your race program...',
        });
        
        // Refresh recent uploads
        loadRecentUploads();
      } else {
        throw new Error(response.error || 'Upload failed');
      }
    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
      
      console.error('Upload error:', error);
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  const navigateToChat = (raceCardId?: string) => {
    navigation.navigate('Chat', { raceCardId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[config.colors.primary, config.colors.secondary]}
        style={styles.header}
      >
        <Animatable.View animation="fadeInDown" duration={1000}>
          <Text style={styles.title}>🏇 Railbird</Text>
          <Text style={styles.subtitle}>Your AI Handicapping Assistant</Text>
        </Animatable.View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animatable.View animation="fadeInUp" duration={1000} delay={300}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upload Race Program</Text>
            <Text style={styles.sectionDescription}>
              Upload a PDF race program or photo to get expert handicapping insights
            </Text>

            <View style={styles.uploadButtons}>
              <TouchableOpacity
                style={[styles.uploadButton, styles.pdfButton]}
                onPress={pickDocument}
                disabled={isUploading}
              >
                <Text style={styles.uploadButtonIcon}>📄</Text>
                <Text style={styles.uploadButtonText}>PDF Document</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.uploadButton, styles.imageButton]}
                onPress={pickImage}
                disabled={isUploading}
              >
                <Text style={styles.uploadButtonIcon}>📸</Text>
                <Text style={styles.uploadButtonText}>Photo/Image</Text>
              </TouchableOpacity>
            </View>

            {isUploading && (
              <View style={styles.uploadProgress}>
                <Text style={styles.uploadProgressText}>Processing... {uploadProgress}%</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, { width: `${uploadProgress}%` }]}
                  />
                </View>
              </View>
            )}
          </View>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" duration={1000} delay={600}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigateToChat()}
            >
              <Text style={styles.actionButtonIcon}>💬</Text>
              <View style={styles.actionButtonContent}>
                <Text style={styles.actionButtonTitle}>Start New Chat</Text>
                <Text style={styles.actionButtonDescription}>
                  Begin a conversation without uploading a program
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('History')}
            >
              <Text style={styles.actionButtonIcon}>📚</Text>
              <View style={styles.actionButtonContent}>
                <Text style={styles.actionButtonTitle}>View History</Text>
                <Text style={styles.actionButtonDescription}>
                  See your past uploads and chat sessions
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animatable.View>

        {recentUploads.length > 0 && (
          <Animatable.View animation="fadeInUp" duration={1000} delay={900}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Uploads</Text>
              
              {recentUploads.map((upload, index) => (
                <TouchableOpacity
                  key={upload.id}
                  style={styles.recentItem}
                  onPress={() => navigateToChat(upload.raceCardId)}
                >
                  <Text style={styles.recentItemIcon}>📄</Text>
                  <View style={styles.recentItemContent}>
                    <Text style={styles.recentItemTitle}>
                      {upload.originalName}
                    </Text>
                    <Text style={styles.recentItemDate}>
                      {new Date(upload.uploadedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.recentItemArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animatable.View>
        )}
      </ScrollView>

      <View style={styles.connectionStatus}>
        <View style={[
          styles.connectionIndicator,
          { backgroundColor: isConnected ? config.colors.success : config.colors.error }
        ]} />
        <Text style={styles.connectionText}>
          {isConnected ? 'Connected' : 'Offline'}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  uploadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pdfButton: {
    borderColor: config.colors.primary,
    borderWidth: 2,
  },
  imageButton: {
    borderColor: config.colors.secondary,
    borderWidth: 2,
  },
  uploadButtonIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  uploadProgress: {
    marginTop: 20,
    alignItems: 'center',
  },
  uploadProgressText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 10,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: config.colors.primary,
    borderRadius: 3,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  actionButtonContent: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  actionButtonDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  recentItemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  recentItemContent: {
    flex: 1,
  },
  recentItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  recentItemDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  recentItemArrow: {
    fontSize: 16,
    color: '#d1d5db',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  connectionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionText: {
    fontSize: 12,
    color: '#6b7280',
  },
});