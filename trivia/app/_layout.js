// app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#6366F1'},
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: 'Categories', headerShown: false }} // hide header on home
        />
        <Stack.Screen
          name="quiz/levels"
          options={{ title: 'Level', headerShown: true }} // hide header on home
        />
        <Stack.Screen
          name="quiz/QuizScreen"
          options={{ title: 'Questions', headerShown: true }} // hide header on home
        />
        {/* Add more <Stack.Screen /> later for other routes */}
      </Stack>
      <StatusBar style="light" backgroundColor="#111827" />
    </>
  );
}