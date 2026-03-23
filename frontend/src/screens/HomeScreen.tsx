import { View, Text, Button } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scanLocalMusic } from "../utils/scanLocalMusic";
import { useLibraryStore } from "../store/library.store";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();     // Tells unsafe zones for mobile

  const setTracks = useLibraryStore((s) => s.setTracks);

  const scanMusic = async () => {
    console.log("SCAN BUTTON PRESSED"); 

    try {
      const tracks = await scanLocalMusic();
      setTracks(tracks);
      console.log("FOUND TRACKS: ", tracks.length);
    } catch (err) {
      console.log("SCAN ERROR: ", err);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: insets.top }}>
      <Button title= "Scan Local Music" onPress= {scanMusic} />
      <Text>Check console for results</Text>
    </View>
  );
}