import React, { useEffect, useState, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, Switch, StyleSheet, Dimensions, Alert, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const USER_DATA_KEY = 'user_profile';

export const SettingsModal = ({ isVisible, onClose, isSoundOn, onToggleMusic, onResetComplete }) => {
  const [user, setUser] = useState(null);
  const [showResetChip, setShowResetChip] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) loadUserData();
  }, [isVisible]);

  const loadUserData = async () => {
    try {
      const savedUser = await AsyncStorage.getItem(USER_DATA_KEY);
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch (e) {
      console.error("Failed to load user info", e);
    }
  };

  const triggerResetChip = () => {
    setShowResetChip(true);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 60, useNativeDriver: true, tension: 40, friction: 8 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true })
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -100, duration: 400, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 400, useNativeDriver: true })
      ]).start(() => {
        setShowResetChip(false);
        if (onResetComplete) onResetComplete();
      });
    }, 2000);
  };

  const handleReset = () => {
    Alert.alert(
      "Reset Progress",
      "This will permanently delete your profile and scores.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset Everything", 
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['levelData', USER_DATA_KEY, 'totalGems', 'total_gems']);
              triggerResetChip();
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
        
        {showResetChip && (
          <Animated.View style={[styles.chipContainer, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
            <View style={styles.chip}>
              <Ionicons name="checkmark-circle" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.chipText}>Progress cleared successfully</Text>
            </View>
          </Animated.View>
        )}

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

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

          <TouchableOpacity style={[styles.row, styles.noBorder]} onPress={handleReset}>
            <View style={styles.resetContainer}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" style={{ marginRight: 10 }} />
              <Text style={[styles.text, { color: '#EF4444' }]}>Reset Game Progress</Text>
            </View>
          </TouchableOpacity>

          {/* --- BRANDING FOOTER --- */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Powered by </Text>
            <Text style={styles.brandText}>Lim Technologies</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'center', alignItems: 'center' },
  chipContainer: { position: 'absolute', top: 0, zIndex: 9999, width: '100%', alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 50,
    alignItems: 'center',
    elevation: 25,
  },
  chipText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  content: { width: width * 0.88, backgroundColor: '#FFFFFF', borderRadius: 32, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
  },
  avatarCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#9129d6', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  profileInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  userAge: { fontSize: 14, color: '#64748B', marginBottom: 4 },
  idBadge: { backgroundColor: '#E2E8F0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  idText: { fontSize: 10, color: '#475569', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15 },
  iconRow: { flexDirection: 'row', alignItems: 'center' },
  noBorder: { borderBottomWidth: 0 },
  text: { color: '#334155', fontSize: 16, fontWeight: '600' },
  resetContainer: { flexDirection: 'row', alignItems: 'center' },
  // Branding Styles
  footer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.6
  },
  footerText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  brandText: { fontSize: 12, color: '#4F46E5', fontWeight: '700' }
});
