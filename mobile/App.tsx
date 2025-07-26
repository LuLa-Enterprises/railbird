import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import { AppNavigator } from './src/navigation/AppNavigator';
import { wsService } from './src/services/websocket.service';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize WebSocket connection
      try {
        await wsService.connect();
        console.log('WebSocket connected successfully');
      } catch (error) {
        console.warn('WebSocket connection failed:', error);
        // App can still work without WebSocket
      }

      // Hide splash screen
      await SplashScreen.hideAsync();
    } catch (error) {
      console.error('App initialization error:', error);
      await SplashScreen.hideAsync();
    }
  };

  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator />
      <Toast />
    </>
  );
}
