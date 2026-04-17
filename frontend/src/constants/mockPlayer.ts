import { ImageSourcePropType } from 'react-native';

export const playerPalette = {
  screen: '#efe9dc',
  surface: '#f8f3e8',
  surfaceStrong: '#fcf9f1',
  shadow: '#d8ccb8',
  text: '#8f826d',
  textMuted: '#c3b7a4',
  line: '#d7c9b4',
};

export interface MockPlayerTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork: ImageSourcePropType;
  progress: number;
  elapsedLabel: string;
  durationLabel: string;
}

export const mockPlayerTrack: MockPlayerTrack = {
  id: 'mock-no-tears',
  title: 'no tears left to cry',
  artist: 'Ariana Grande',
  album: 'sweetener',
  artwork: require('../../assets/icon.png'),
  progress: 0.36,
  elapsedLabel: '0:37',
  durationLabel: '4:25',
};
