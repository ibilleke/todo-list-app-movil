import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import type { RootStackParamList } from "./src/navigation/types";
import TaskListScreen from "./src/screens/TaskListScreen";
import TaskFormScreen from "./src/screens/TaskFormScreen";
import { colors } from "./src/theme/colors";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.surface,
          headerTitleStyle: { fontWeight: "700" },
        }}
      >
        <Stack.Screen
          name="TaskList"
          component={TaskListScreen}
          options={{ title: "Mis tareas" }}
        />
        <Stack.Screen
          name="TaskForm"
          component={TaskFormScreen}
          options={{ title: "Tarea" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
