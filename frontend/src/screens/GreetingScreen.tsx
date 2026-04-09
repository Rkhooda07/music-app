import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { useUserStore } from '../store/user.store';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

const genres = [
  { id: 'chill', label: 'Chill', color: theme.colors.chill },
  { id: 'rap', label: 'Rap', color: theme.colors.rap },
  { id: 'hardcore', label: 'Hardcore', color: theme.colors.hardcore },
  { id: 'love', label: 'Love', color: theme.colors.accent },
];

const GreetingScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const setFeeling = useUserStore(s => s.setFeeling);
  const resetFeeling = useUserStore(s => s.reset);
  const selectedFeeling = useUserStore(s => s.feeling);

  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(18)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(18)).current;
  const profileOpacity = useRef(new Animated.Value(0)).current;
  const profileTranslateY = useRef(new Animated.Value(40)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    resetFeeling();
  }, [resetFeeling]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(600),
        Animated.parallel([
          Animated.timing(subtitleOpacity, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(subtitleTranslateY, {
            toValue: 0,
            duration: 800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(2000),
        Animated.parallel([
          Animated.timing(profileOpacity, {
            toValue: 1,
            duration: 1000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(profileTranslateY, {
            toValue: 0,
            duration: 1000,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [profileOpacity, profileTranslateY, subtitleOpacity, subtitleTranslateY, titleOpacity, titleTranslateY]);

  useEffect(() => {
    Animated.timing(footerOpacity, {
      toValue: 1,
      duration: 350,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [footerOpacity]);

  const handleGenreSelect = (id: string) => {
    if (selectedFeeling === id) {
      resetFeeling();
      return;
    }

    setFeeling(id);
  };

  const handleContinue = () => {
    if (!selectedFeeling) {
      setFeeling('freestyle');
    }

    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Animated.Text
          style={[
            styles.greeting,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          Hola Rkxee
        </Animated.Text>
        <Animated.Text
          style={[
            styles.subGreeting,
            {
              opacity: subtitleOpacity,
              transform: [{ translateY: subtitleTranslateY }],
            },
          ]}
        >
          How're you feeling?
        </Animated.Text>
      </View>

      <Animated.View
        style={[
          styles.gridContainer,
          {
            opacity: profileOpacity,
            transform: [{ translateY: profileTranslateY }],
          },
        ]}
      >
        <View style={styles.grid}>
          {genres.map((genre) => (
            <TouchableOpacity
              key={genre.id}
              onPress={() => handleGenreSelect(genre.id)}
              activeOpacity={0.8}
              style={[
                styles.card,
                {
                  backgroundColor: genre.color,
                  borderWidth: selectedFeeling === genre.id ? 4 : 0,
                  borderColor: '#FFF',
                },
              ]}
            >
              <Text style={styles.cardLabel}>{genre.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.footer,
          {
            opacity: footerOpacity,
          },
        ]}
      >
        <TouchableOpacity onPress={handleContinue}>
          <Text style={styles.continueText}>
            {selectedFeeling ? 'Click to continue to home page' : "I'll freestyle"}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingTop: 24,
  },
  header: {
    marginBottom: 50,
  },
  greeting: {
    fontSize: 48,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -1,
  },
  subGreeting: {
    fontSize: 32,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  gridContainer: {
    marginTop: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: (width - 80) / 2,
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primaryLight,
    letterSpacing: 0.5,
    opacity: 0.8,
  },
});

export default GreetingScreen;
