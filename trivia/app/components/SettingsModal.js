import React from 'react';
import { Modal, View, Text, TouchableOpacity, Switch, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export const SettingsModal = ({ isVisible, onClose, isSoundOn, onToggleMusic }) => (
  <Modal animationType="slide" transparent visible={isVisible}>
    <View style={styles.overlay}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <Text style={styles.text}>Background Music</Text>
          <Switch value={isSoundOn} onValueChange={onToggleMusic} trackColor={{ false: '#E2E8F0', true: '#4F46E5' }} />
        </View>
        <View style={styles.row}>
          <Text style={styles.text}>Sound Effects</Text>
          <Switch trackColor={{ false: '#E2E8F0', true: '#4F46E5' }} />
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  content: { width: width * 0.85, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  text: { color: '#334155', fontSize: 16, fontWeight: '600' },
});
