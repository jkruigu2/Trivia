import React from 'react';
import { Modal, View, Text, TouchableOpacity, Switch, StyleSheet, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export const SettingsModal = ({ isVisible, onClose, isSoundOn, onToggleMusic, onResetComplete }) => {
  
  const handleReset = () => {
    Alert.alert(
      "Reset Progress",
      "This will permanently delete all your levels, scores, and gems. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset Everything", 
          style: "destructive",
          onPress: async () => {
            try {
              // Clears the specific keys used in the app
              await AsyncStorage.multiRemove(['levelData', 'total_gems']);
              
              Alert.alert("Success", "Progress has been reset.");
              
              // Optional: Callback to refresh the parent component's state
              if (onResetComplete) onResetComplete();
              
              onClose();
            } catch (e) {
              console.error("Failed to reset storage", e);
            }
          }
        }
      ]
    );
  };

  return (
    <Modal animationType="slide" transparent visible={isVisible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Existing Music Toggle */}
          <View style={styles.row}>
            <Text style={styles.text}>Background Music</Text>
            <Switch 
              value={isSoundOn} 
              onValueChange={onToggleMusic} 
              trackColor={{ false: '#E2E8F0', true: '#4F46E5' }} 
            />
          </View>
          {/* NEW: Reset Progress Option */}
          <TouchableOpacity style={[styles.row, styles.noBorder]} onPress={handleReset}>
            <View style={styles.resetContainer}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={[styles.text, { color: '#EF4444' }]}>Reset Game Progress</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15, 23, 42, 0.7)', // Darker overlay for better focus
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  content: { 
    width: width * 0.85, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 24, 
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 10 
  },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9' 
  },
  noBorder: { borderBottomWidth: 0 },
  text: { color: '#334155', fontSize: 16, fontWeight: '600' },
  resetContainer: {
    flexDirection: 'row',
    alignItems: 'right',
  }
});
