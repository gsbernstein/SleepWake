import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
} from 'react-native';
import { useSchedule } from '../context/ScheduleContext';
import { Schedule } from '../types/schedule';

const NIGHT_LIGHT_COLORS = [
  { name: 'Purple', value: '#8A2BE2' },
  { name: 'Blue', value: '#4169E1' },
  { name: 'Green', value: '#32CD32' },
  { name: 'Red', value: '#DC143C' },
  { name: 'Orange', value: '#FFA500' },
  { name: 'Pink', value: '#FF69B4' },
];

export const ScheduleScreen: React.FC = () => {
  const { schedules, addSchedule, updateSchedule, deleteSchedule, setActiveSchedule } = useSchedule();
  const [newSchedule, setNewSchedule] = useState<Partial<Schedule>>({
    name: '',
    bedtime: '20:00',
    wakeTime: '07:00',
    warningTime: 15,
    isActive: false,
    isNightLight: false,
    nightLightColor: '#8A2BE2',
    isNap: false,
  });
  
  const [colorPickerVisible, setColorPickerVisible] = useState(false);

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
        nightLightColor: '#8A2BE2',
        isNap: false,
      });
    }
  };

  const selectColor = (color: string) => {
    setNewSchedule({ ...newSchedule, nightLightColor: color });
    setColorPickerVisible(false);
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
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Night Light</Text>
          <View style={styles.switchContainer}>
            <Text>Enable Night Light</Text>
            <Switch
              value={newSchedule.isNightLight}
              onValueChange={(value) => setNewSchedule({ ...newSchedule, isNightLight: value })}
            />
          </View>
          
          {newSchedule.isNightLight && (
            <View style={styles.colorPickerContainer}>
              <Text style={styles.colorPickerLabel}>Night Light Color:</Text>
              <TouchableOpacity 
                style={[styles.colorPreview, { backgroundColor: newSchedule.nightLightColor }]}
                onPress={() => setColorPickerVisible(true)}
              />
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule Type</Text>
          <View style={styles.switchContainer}>
            <Text>Is Nap</Text>
            <Switch
              value={newSchedule.isNap}
              onValueChange={(value) => setNewSchedule({ ...newSchedule, isNap: value })}
            />
          </View>
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
              {schedule.isNightLight && (
                <View style={styles.scheduleDetail}>
                  <Text>Night Light: </Text>
                  <View style={[styles.colorIndicator, { backgroundColor: schedule.nightLightColor }]} />
                </View>
              )}
              {schedule.isNap && <Text>Type: Nap</Text>}
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
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={colorPickerVisible}
        onRequestClose={() => setColorPickerVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Night Light Color</Text>
            <View style={styles.colorGrid}>
              {NIGHT_LIGHT_COLORS.map((color) => (
                <TouchableOpacity
                  key={color.value}
                  style={[styles.colorOption, { backgroundColor: color.value }]}
                  onPress={() => selectColor(color.value)}
                >
                  <Text style={styles.colorName}>{color.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setColorPickerVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  section: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  colorPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  colorPickerLabel: {
    marginRight: 10,
  },
  colorPreview: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ddd',
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
  scheduleDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  colorIndicator: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    marginLeft: 5,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  colorOption: {
    width: 80,
    height: 80,
    margin: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorName: {
    color: '#ffffff',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  closeButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 