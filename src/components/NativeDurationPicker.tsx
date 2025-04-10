import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface NativeDurationPickerProps {
  value: { hours: number; minutes: number };
  onChange: (value: { hours: number; minutes: number }) => void;
  minuteStep?: number;
  showHours?: boolean;
  maxHours?: number;
  maxMinutes?: number;
  title?: string;
  visible: boolean;
  onClose: () => void;
}

export const NativeDurationPicker: React.FC<NativeDurationPickerProps> = ({
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
  // Track if this is the initial render
  const isInitialMount = useRef(true);
  
  // Convert to strings to avoid type errors
  const [hours, setHours] = useState<string>(value.hours.toString());
  const [minutes, setMinutes] = useState<string>(value.minutes.toString());

  // Only update internal state when modal becomes visible, not on every render
  useEffect(() => {
    // Only set values from props when the modal opens (visible changes from false to true)
    if (visible && !isInitialMount.current) {
      setHours(value.hours.toString());
      setMinutes(value.minutes.toString());
    }
    
    // After first mount, set ref to false
    isInitialMount.current = false;
  }, [visible]);

  // Generate an array of numbers from 0 to max with optional step
  const generateNumbersArray = (max: number, step: number = 1) => {
    const result = [];
    for (let i = 0; i <= max; i += step) {
      result.push(i.toString()); // Convert to string
    }
    return result;
  };

  const hoursArray = generateNumbersArray(maxHours);
  const minutesArray = generateNumbersArray(maxMinutes, minuteStep);

  const handleSave = () => {
    onChange({ 
      hours: parseInt(hours) || 0, 
      minutes: parseInt(minutes) || 0 
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>{title}</Text>
          
          <View style={styles.pickerContainer}>
            {showHours && (
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Hours</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={hours}
                    onValueChange={(itemValue: string) => setHours(itemValue)}
                    itemStyle={styles.pickerItem}
                  >
                    {hoursArray.map((value) => (
                      <Picker.Item 
                        key={value}
                        label={parseInt(value) < 10 ? `0${value}` : value} 
                        value={value} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            )}
            
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Minutes</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={minutes}
                  onValueChange={(itemValue: string) => setMinutes(itemValue)}
                  itemStyle={styles.pickerItem}
                >
                  {minutesArray.map((value) => (
                    <Picker.Item 
                      key={value}
                      label={parseInt(value) < 10 ? `0${value}` : value} 
                      value={value}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.durationDisplay}>
            <Text style={styles.durationText}>
              Duration: {showHours ? `${parseInt(hours)}h ` : ''}{parseInt(minutes)}m
            </Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
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
    maxWidth: 400,
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
    width: '100%',
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 16,
    marginBottom: 10,
    color: '#666',
  },
  pickerWrapper: {
    width: '100%',
    height: 150,
    ...(Platform.OS === 'android' ? {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      overflow: 'hidden',
    } : {}),
  },
  pickerItem: {
    fontSize: 22,
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
  cancelButtonText: {
    color: '#333',
  },
}); 