import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { useSchedule } from '../context/ScheduleContext';
import { Schedule } from '../types/schedule';

export const ScheduleScreen: React.FC = () => {
  const { schedules, addSchedule, updateSchedule, deleteSchedule, setActiveSchedule } = useSchedule();
  const [newSchedule, setNewSchedule] = useState<Partial<Schedule>>({
    name: '',
    bedtime: '20:00',
    wakeTime: '07:00',
    warningTime: 15,
    isActive: false,
    isNightLight: false,
    nightLightColor: '#1a1a1a',
    isNap: false,
  });

  const handleSave = () => {
    if (newSchedule.name) {
      addSchedule(newSchedule as Omit<Schedule, 'id'>);
      setNewSchedule({
        name: '',
        bedtime: '20:00',
        wakeTime: '07:00',
        warningTime: 15,
        isActive: false,
        isNightLight: false,
        nightLightColor: '#1a1a1a',
        isNap: false,
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Add New Schedule</Text>
        <TextInput
          style={styles.input}
          placeholder="Schedule Name"
          value={newSchedule.name}
          onChangeText={(text) => setNewSchedule({ ...newSchedule, name: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Bedtime (HH:mm)"
          value={newSchedule.bedtime}
          onChangeText={(text) => setNewSchedule({ ...newSchedule, bedtime: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Wake Time (HH:mm)"
          value={newSchedule.wakeTime}
          onChangeText={(text) => setNewSchedule({ ...newSchedule, wakeTime: text })}
        />
        <TextInput
          style={styles.input}
          placeholder="Warning Time (minutes)"
          value={newSchedule.warningTime?.toString()}
          onChangeText={(text) => setNewSchedule({ ...newSchedule, warningTime: parseInt(text) || 15 })}
          keyboardType="numeric"
        />
        <View style={styles.switchContainer}>
          <Text>Night Light</Text>
          <Switch
            value={newSchedule.isNightLight}
            onValueChange={(value) => setNewSchedule({ ...newSchedule, isNightLight: value })}
          />
        </View>
        <View style={styles.switchContainer}>
          <Text>Is Nap</Text>
          <Switch
            value={newSchedule.isNap}
            onValueChange={(value) => setNewSchedule({ ...newSchedule, isNap: value })}
          />
        </View>
        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Save Schedule</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.scheduleList}>
        <Text style={styles.title}>Existing Schedules</Text>
        {schedules.map((schedule) => (
          <View key={schedule.id} style={styles.scheduleItem}>
            <View>
              <Text style={styles.scheduleName}>{schedule.name}</Text>
              <Text>Bedtime: {schedule.bedtime}</Text>
              <Text>Wake Time: {schedule.wakeTime}</Text>
              <Text>Warning Time: {schedule.warningTime} minutes</Text>
            </View>
            <View style={styles.scheduleActions}>
              <TouchableOpacity
                style={[styles.actionButton, schedule.isActive && styles.activeButton]}
                onPress={() => setActiveSchedule(schedule.id)}
              >
                <Text style={styles.actionButtonText}>
                  {schedule.isActive ? 'Active' : 'Activate'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => deleteSchedule(schedule.id)}
              >
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 20,
    backgroundColor: '#ffffff',
    margin: 10,
    borderRadius: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scheduleList: {
    padding: 20,
  },
  scheduleItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scheduleName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  scheduleActions: {
    justifyContent: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: 5,
    backgroundColor: '#007AFF',
    marginBottom: 5,
  },
  activeButton: {
    backgroundColor: '#34C759',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
  },
}); 