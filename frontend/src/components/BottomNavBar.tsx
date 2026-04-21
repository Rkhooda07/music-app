import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Search, Library, Settings } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  isActive?: boolean;
}

export const BottomNavBar = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, opacity]);

  const navItems: NavItem[] = [
    {
      label: 'Home',
      icon: <Home size={24} color="#8f826d" strokeWidth={2} />,
      onPress: () => navigation.navigate('Home'),
      isActive: true,
    },
    {
      label: 'Search',
      icon: <Search size={24} color="#b7a89a" strokeWidth={2} />,
      onPress: () => {},
    },
    {
      label: 'Library',
      icon: <Library size={24} color="#b7a89a" strokeWidth={2} />,
      onPress: () => {},
    },
    {
      label: 'Settings',
      icon: <Settings size={24} color="#b7a89a" strokeWidth={2} />,
      onPress: () => {},
    },
  ];

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.shadowLayer} />
      <View style={styles.navContainer}>
        <View style={styles.navContent}>
          {navItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.75}
              style={[
                styles.navItem,
                item.isActive && styles.navItemActive,
              ]}
              onPress={item.onPress}
            >
              <View style={styles.iconContainer}>
                {item.isActive && <View style={styles.activeIndicator} />}
                {item.icon}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  shadowLayer: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: -8,
    bottom: 0,
    borderRadius: 32,
    backgroundColor: 'rgba(216, 204, 184, 0.16)',
    shadowColor: '#d8ccb8',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 12,
  },
  navContainer: {
    marginHorizontal: 16,
    borderRadius: 32,
    backgroundColor: '#fcf9f1',
    borderWidth: 1,
    borderColor: 'rgba(220, 208, 189, 0.85)',
    paddingHorizontal: 8,
  },
  navContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 64,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  navItemActive: {
    // Styling for active state if needed
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8f826d',
  },
});
