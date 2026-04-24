import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  GreetingScreen,
  HomeScreen,
  LibraryScreen,
  PlayerScreen,
  SearchScreen,
} from '../screens';

import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
    >
      <Stack.Screen name="Greeting" component={GreetingScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Library" component={LibraryScreen} />
      <Stack.Screen
        name="Player"
        component={PlayerScreen}
        options={{
          presentation: 'transparentModal',
          animation: 'none',
          contentStyle: {
            backgroundColor: 'transparent',
          },
        }}
      />
    </Stack.Navigator>
  );
};
