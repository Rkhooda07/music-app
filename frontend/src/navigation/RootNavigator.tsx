import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GreetingScreen from '../screens/GreetingScreen';
import HomeScreen from '../screens/HomeScreen';

import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="Greeting" component={GreetingScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
};
