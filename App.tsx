import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ScheduleProvider } from './src/context/ScheduleContext';
import { Clock } from './src/components/Clock';
import { ScheduleScreen } from './src/screens/ScheduleScreen';
import { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <ScheduleProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Clock"
            component={Clock}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Schedules"
            component={ScheduleScreen}
            options={{
              title: 'Manage Schedules',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ScheduleProvider>
  );
} 