import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Search, Library, Settings } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type NavRoute = keyof RootStackParamList;

interface NavItem {
  label: string;
  icon: (color: string) => React.ReactNode;
  route?: NavRoute;
  onPress: () => void;
}

export const BottomNavBar = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, NavRoute>>();
  const insets = useSafeAreaInsets();
  const indicatorX = useRef(new Animated.Value(0)).current;
  const [navWidth, setNavWidth] = useState(0);

  const activeRoute = route.name as NavRoute;

  const navItems: NavItem[] = [
    {
      label: 'Home',
      route: 'Home',
      icon: (color: string) => <Home size={24} strokeWidth={2} color={color} />,
      onPress: () => navigation.navigate('Home'),
    },
    {
      label: 'Search',
      route: 'Search',
      icon: (color: string) => <Search size={24} strokeWidth={2} color={color} />,
      onPress: () => navigation.navigate('Search'),
    },
    {
      label: 'Library',
      route: 'Library',
      icon: (color: string) => <Library size={24} strokeWidth={2} color={color} />,
      onPress: () => navigation.navigate('Library'),
    },
    {
      label: 'Settings',
      icon: (color: string) => <Settings size={24} strokeWidth={2} color={color} />,
      onPress: () => {},
    },
  ];

  useEffect(() => {
    if (!navWidth) {
      return;
    }

    const items = navItems.length;
    const itemWidth = navWidth / items;
    const activeIndex = navItems.findIndex((item) => item.route === activeRoute);
    const targetX = activeIndex >= 0 ? itemWidth * activeIndex + itemWidth / 2 - 3 : 0;

    Animated.spring(indicatorX, {
      toValue: targetX,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  }, [activeRoute, indicatorX, navWidth, navItems]);

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      <View style={styles.shadowLayer} />
      <View style={styles.navContainer}>
        <View
          style={styles.navContent}
          onLayout={(event) => setNavWidth(event.nativeEvent.layout.width)}
        >
          <Animated.View
            style={[
              styles.animatedIndicator,
              { transform: [{ translateX: indicatorX }] },
            ]}
          />
          {navItems.map((item, index) => {
            const isActive = item.route === activeRoute;
            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.75}
                style={styles.navItem}
                onPress={item.onPress}
              >
                <View style={styles.iconContainer}>
                  {item.icon(isActive ? '#8f826d' : '#b7a89a')}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
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
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  animatedIndicator: {
    position: 'absolute',
    bottom: 14,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#a18f7d',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
