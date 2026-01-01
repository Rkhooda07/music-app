import { View, Text, TextInput, FlatList, Pressable } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();     // Tells unsafe zones for mobile

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: insets.top }}>
      <Text>Home screen coming soon !!!</Text>
    </View>
  );
}