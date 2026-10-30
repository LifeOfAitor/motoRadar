import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { MainScreen } from './src/ui/MainScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <MainScreen />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
