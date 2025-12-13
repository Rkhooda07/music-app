import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "./src/screens/HomeScreen";
import SearchScreen from "./src/screens/SearchScreen";
import LibraryScreen from "./src/screens/LibraryScreen";
import PlayerScreen from "./src/screens/PlayerScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name= "Home" component={HomeScreen} />
        <Tab.Screen name= "Search" component={SearchScreen} />
        <Tab.Screen name= "Library" component={LibraryScreen} />
        <Tab.Screen name= "Player" component={PlayerScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}