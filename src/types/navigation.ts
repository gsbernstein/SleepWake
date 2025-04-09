import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Clock: undefined;
  Schedules: undefined;
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>; 