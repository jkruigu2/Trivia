import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Switch, StyleSheet, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const USER_DATA_KEY = 'user_profile';

export const SettingsModal = ({ isVisible, onClose, isSoundOn, onToggleMusic, onResetComplete }) => {
  const [user, setUser] = useState(null);

  // Load user data when modal opens
  useEffect(() => {
    if (isVisible) {
      loadUserData();
    }
  }, [isVisible]);

  const loadUserData = async () => {
    try {
      const savedUser = await AsyncStorage.getItem(USER_DATA_KEY);
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch (e) {
      console.error("Failed to load user info", e);
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Reset Progress",
      "This will permanently delete your profile, scores, and gems. The app will need to restart.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset Everything", 
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['levelData', USER_DATA_KEY, 'soundStatus', 'total_gems']);
              Alert.alert("Success", "Progress cleared.");
              if (onResetComplete) onResetComplete();
              onClose();
            } catch (e) {
              console.error("Failed to reset", e);
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

          {/* User Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || '?'}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
              <Text style={styles.userAge}>Age: {user?.age || 'N/A'}</Text>
              <View style={styles.idBadge}>
                <Text style={styles.idText}>ID: {user?.id || '---------'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Music Toggle */}
          <View style={styles.row}>
            <View style={styles.iconRow}>
              <Ionicons name="musical-notes-outline" size={20} color="#4F46E5" style={{ marginRight: 10 }} />
              <Text style={styles.text}>Background Music</Text>
            </View>
            <Switch 
              value={isSoundOn} 
              onValueChange={onToggleMusic} 
              trackColor={{ false: '#E2E8F0', true: '#4F46E5' }} 
            />
          </View>

          {/* Reset Progress Option */}
          <TouchableOpacity style={[styles.row, styles.noBorder]} onPress={handleReset}>
            <View style={styles.resetContainer}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" style={{ marginRight: 10 }} />
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
    backgroundColor: 'rgba(15, 23, 42, 0.8)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  content: { 
    width: width * 0.88, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 30, 
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 20,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 20 
  },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  
  // Profile Section Styles
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#9129d6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  profileInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  userAge: { fontSize: 14, color: '#64748B', marginBottom: 4 },
  idBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start'
  },
  idText: { fontSize: 10, fontFamily: 'monospace', color: '#475569' },
  
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 15, 
  },
  iconRow: { flexDirection: 'row', alignItems: 'center' },
  noBorder: { borderBottomWidth: 0 },
  text: { color: '#334155', fontSize: 16, fontWeight: '600' },
  resetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  }
});
