import { ImageSourcePropType } from 'react-native';
import { MusicTrack } from '../types/music';

export const playerPalette = {
  screen: '#efe9dc',
  surface: '#f8f3e8',
  surfaceStrong: '#fcf9f1',
  shadow: '#d8ccb8',
  text: '#8f826d',
  textMuted: '#c3b7a4',
  line: '#d7c9b4',
};

export const fallbackArtwork: ImageSourcePropType = require('../../assets/icon.png');

// Fallback track for when backend is unavailable
export const fallbackTrack: MusicTrack = {
  id: 'fallback-track-001',
  title: 'Smooth Vibes',
  artist: 'Lofi Beats',
  duration: 180,
  thumbnail: undefined,
};

// Fallback tracks list for search results
export const fallbackTracks: MusicTrack[] = [
  {
    id: 'fallback-1',
    title: 'Midnight Jazz',
    artist: 'Blue Notes Collective',
    duration: 240,
    thumbnail: undefined,
  },
  {
    id: 'fallback-2',
    title: 'Ocean Waves',
    artist: 'Ambient Dreams',
    duration: 210,
    thumbnail: undefined,
  },
  {
    id: 'fallback-3',
    title: 'Urban Sunset',
    artist: 'City Lights',
    duration: 195,
    thumbnail: undefined,
  },
  {
    id: 'fallback-4',
    title: 'Forest Rain',
    artist: 'Nature Sounds',
    duration: 225,
    thumbnail: undefined,
  },
  {
    id: 'fallback-5',
    title: 'Electric Pulse',
    artist: 'Synth Wave',
    duration: 205,
    thumbnail: undefined,
  },
];
