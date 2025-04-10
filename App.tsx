import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ScheduleProvider } from './src/context/ScheduleContext';
import { Clock } from './src/components/Clock';
import { ScheduleScreen } from './src/screens/ScheduleScreen';
import { RootStackParamList } from './src/types/navigation';
import { Platform, Dimensions } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();
const isTablet = Dimensions.get('window').width >= 768;

export default function App() {
  return (
    <ScheduleProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
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
              headerShown: true,
              presentation: isTablet ? 'modal' : 'card',
              // For iPad split view
              ...(isTablet && {
                presentation: 'formSheet',
                headerLargeTitle: true,
                headerStyle: {
                  backgroundColor: '#f5f5f5',
                },
              }),
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ScheduleProvider>
  );
} 