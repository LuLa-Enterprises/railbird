import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { config } from '../constants/config';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Home Stack Navigator
const HomeStackNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: '#f8fafc' },
    }}
  >
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Chat" component={ChatScreen} />
  </Stack.Navigator>
);

// Placeholder screens for other tabs
const HistoryScreen = () => (
  <div style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <h2>History</h2>
    <p>Your upload and chat history will appear here</p>
  </div>
);

const SettingsScreen = () => (
  <div style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <h2>Settings</h2>
    <p>App settings and preferences</p>
  </div>
);

// Main Tab Navigator
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: config.colors.primary,
      tabBarInactiveTintColor: '#9ca3af',
      tabBarStyle: {
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600',
      },
    }}
  >
    <Tab.Screen
      name="HomeTab"
      component={HomeStackNavigator}
      options={{
        tabBarLabel: 'Home',
        tabBarIcon: ({ color, size }) => (
          <span style={{ fontSize: size, color }}>🏠</span>
        ),
      }}
    />
    <Tab.Screen
      name="History"
      component={HistoryScreen}
      options={{
        tabBarLabel: 'History',
        tabBarIcon: ({ color, size }) => (
          <span style={{ fontSize: size, color }}>📚</span>
        ),
      }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsScreen}
      options={{
        tabBarLabel: 'Settings',
        tabBarIcon: ({ color, size }) => (
          <span style={{ fontSize: size, color }}>⚙️</span>
        ),
      }}
    />
  </Tab.Navigator>
);

// Main App Navigator
export const AppNavigator = () => (
  <NavigationContainer>
    <TabNavigator />
  </NavigationContainer>
);