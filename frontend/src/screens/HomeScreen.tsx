import { View, Text, TextInput, FlatList, Pressable } from "react-native";
import { useState } from "react";
import api from "../api/client";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Track = {
  videoId: string,
  title: string,
  channel: string,
  thumbnail: string
};

export default function HomeScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);

  const insets = useSafeAreaInsets();     // Tells unsafe zones for mobile

  const search = async (text: string) => {
    setQuery(text);

    const trimmed = text.trim();
    if (trimmed.length < 3) return;

    try {
      const res = await api.get("/yt/search", {
        params: { q: trimmed },
      });
      setResults(res.data);
    } catch (err) {
      console.log("SEARCH ERROR: ", err);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingTop: insets.top }}>
      <TextInput 
        placeholder="Search songs"
        value={query}
        onChangeText={search}
        style={{
          borderWidth: 1,
          padding: 12,
          borderRadius: 6
        }}
      />
      <Text>Type at least 3 characters</Text>

      <FlatList 
        data={results}
        keyExtractor={(item) => item.videoId}
        renderItem={({ item }) => (
          <Pressable
            onPress= {() => console.log("TAPPED: ", item.videoId)}
            style= {{ paddingVertical: 12 }}
          >
            <Text style= {{ fontWeight: "600" }}>
              {item.title}
            </Text>
            <Text style= {{ color: "#666" }}>
              {item.channel}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}