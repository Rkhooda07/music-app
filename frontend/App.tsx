import React from 'react';
import { View, StatusBar } from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, Search, Library, Music2 } from "lucide-react-native";

import HomeScreen from "./src/screens/HomeScreen";
import SearchScreen from "./src/screens/SearchScreen";
import LibraryScreen from "./src/screens/LibraryScreen";
import PlayerScreen from "./src/screens/PlayerScreen";

import { RootTabParamList } from "./src/navigation/types";
import { theme } from "./src/utils/theme";
import { MiniPlayer } from "./src/components/MiniPlayer";
import { usePlayerStore } from './src/store/player.store';

const Tab = createBottomTabNavigator<RootTabParamList>();

const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.text,
    border: theme.colors.border,
    primary: theme.colors.primary,
  },
};

function TabNavigator() {
  const currentTrack = usePlayerStore(s => s.currentTrack);
  const bottomPadding = currentTrack ? 60 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: 'rgba(28, 28, 34, 0.95)',
            borderTopWidth: 0,
            position: 'absolute',
            elevation: 0,
            height: 60,
            paddingBottom: 10,
          },
          tabBarActiveTintColor: theme.colors.primaryLight,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          sceneStyle: { paddingBottom: bottomPadding } // Shift content up when mini player is active
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
          }}
        />
        <Tab.Screen 
          name="Search" 
          component={SearchScreen} 
          options={{
            tabBarIcon: ({ color, size }) => <Search color={color} size={size} />
          }}
        />
        <Tab.Screen 
          name="Library" 
          component={LibraryScreen} 
          options={{
            tabBarIcon: ({ color, size }) => <Library color={color} size={size} />
          }}
        />
      </Tab.Navigator>
      <MiniPlayer />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      <NavigationContainer theme={DarkTheme}>
        <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
           {/* Wrap TabNavigator to give PlayerScreen full screen without tabs */}
          <Tab.Screen name="Main" component={TabNavigator} />
          <Tab.Screen 
            name="Player" 
            component={PlayerScreen} 
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}