import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';

interface DurationPickerProps {
  value: { hours: number; minutes: number };
  onChange: (value: { hours: number; minutes: number }) => void;
  minuteStep?: number; // Step for minutes (default 5)
  showHours?: boolean; // Whether to show hours (default true)
  maxHours?: number; // Maximum hours that can be selected (default 12)
  maxMinutes?: number; // Maximum minutes that can be selected (default 59)
  title?: string;
  visible: boolean;
  onClose: () => void;
}

export const DurationPicker: React.FC<DurationPickerProps> = ({
  value,
  onChange,
  minuteStep = 5,
  showHours = true,
  maxHours = 12,
  maxMinutes = 59,
  title = 'Set Duration',
  visible,
  onClose,
}) => {
  const [hours, setHours] = useState(value.hours);
  const [minutes, setMinutes] = useState(value.minutes);

  // Generate an array of numbers from 0 to max with optional step
  const generateNumbers = (max: number, step: number = 1) => {
    const result = [];
    for (let i = 0; i <= max; i += step) {
      result.push(i);
    }
    return result;
  };

  const hoursArray = generateNumbers(maxHours);
  const minutesArray = generateNumbers(maxMinutes, minuteStep);

  const handleSave = () => {
    onChange({ hours, minutes });
    onClose();
  };

  const renderPickerColumn = (
    values: number[], 
    selectedValue: number, 
    onSelect: (value: number) => void,
    label: string
  ) => (
    <View style={styles.column}>
      <Text style={styles.columnLabel}>{label}</Text>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={50}
        decelerationRate="fast"
      >
        <View style={styles.spacer} />
        {values.map((value) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.valueButton,
              value === selectedValue && styles.selectedValue
            ]}
            onPress={() => onSelect(value)}
          >
            <Text style={[
              styles.valueText,
              value === selectedValue && styles.selectedValueText
            ]}>
              {value < 10 ? `0${value}` : value}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{title}</Text>
          
          <View style={styles.pickerContainer}>
            {showHours && renderPickerColumn(
              hoursArray,
              hours,
              (value) => setHours(value),
              'Hours'
            )}
            
            {renderPickerColumn(
              minutesArray,
              minutes,
              (value) => setMinutes(value),
              'Minutes'
            )}
          </View>

          <View style={styles.durationDisplay}>
            <Text style={styles.durationText}>
              Duration: {showHours ? `${hours}h ` : ''}{minutes}m
            </Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.saveButton]} 
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '85%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
  },
  column: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
  },
  columnLabel: {
    fontSize: 16,
    marginBottom: 10,
    color: '#666',
  },
  scrollView: {
    height: 150,
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
  },
  spacer: {
    height: 50,
  },
  valueButton: {
    height: 50,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 22,
    color: '#333',
  },
  selectedValue: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  selectedValueText: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  durationDisplay: {
    marginTop: 20,
    marginBottom: 10,
  },
  durationText: {
    fontSize: 18,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f2f2f2',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
}); 