import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  TextInput, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. SAFE ADMOB IMPORTS
import { BackgroundGlow, Star } from './components/BackgroundEffects';
import { SettingsModal } from './components/SettingsModal';
import { CategoryCard } from './components/CategoryCard';

// Using a try-catch or checking for native module to prevent Expo Go crashes
let BannerAd = null;
let BannerAdSize = null;
let TestIds = { BANNER: 'ca-app-pub-3940256099942544/6300978111' };

try {
  const AdLib = require('react-native-google-mobile-ads');
  const mobileAds = AdLib.default;
  BannerAd = AdLib.BannerAd;
  BannerAdSize = AdLib.BannerAdSize;
  TestIds = AdLib.TestIds;
  
  // Only initialize if the native module exists (prevents Expo Go crash)
  if (Platform.OS !== 'web') {
     mobileAds().initialize();
  }
} catch (e) {
  console.log("AdMob not available (Running in Expo Go or Web)");
}

const SOUND_KEY = 'soundStatus';
const USER_DATA_KEY = 'user_profile';

const DIFFICULTIES = [
  { label: 'Easy', value: 'easy', color: '#4CAF50' },
  { label: 'Medium', value: 'medium', color: '#FF9800' },
  { label: 'Hard', value: 'hard', color: '#F44336' },
];

const CATEGORIES = [
  { name: 'Counties', color: '#3F51B5', icon: '🇰🇪' },
  { name: 'History', color: '#2196F3', icon: '🌅' },
  { name: 'Culture', color: '#F44336', icon: '📜' },
  { name: 'Geography', color: '#4CAF50', icon: '🏔️' },
  { name: 'World', color: '#607D8B', icon: '🌍' },
  { name: 'President', color: '#E91E63', icon: '👔' },
];

export default function HomeScreen() {
  const router = useRouter();
  
  const [selectedDifficulty, setSelectedDifficulty] = useState('easy');
  const [isSettingsVisible, setSettingsVisible] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const soundRef = useRef(null);

  const [userData, setUserData] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [inputName, setInputName] = useState('');
  const [inputAge, setInputAge] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function initializeApp() {
      try {
        const savedUser = await AsyncStorage.getItem(USER_DATA_KEY);
        if (savedUser) {
          setUserData(JSON.parse(savedUser));
        } else {
          setShowRegisterModal(true);
        }

        const savedStatus = await AsyncStorage.getItem(SOUND_KEY);
        const soundEnabled = savedStatus !== null ? JSON.parse(savedStatus) : true;
        
        if (isMounted) setIsSoundOn(soundEnabled);

        const { sound } = await Audio.Sound.createAsync(
          require('./quiz/src/background.mp3'),
          { isLooping: true, shouldPlay: soundEnabled, volume: 0.4 }
        );
        
        soundRef.current = sound;
      } catch (e) {
        console.error("Initialization Error:", e);
      }
    }
    initializeApp();

    return () => {
      isMounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const handleRegister = async () => {
    const ageNum = parseInt(inputAge);
    if (!inputName.trim()) { Alert.alert("Invalid Name", "Please enter your name."); return; }
    if (isNaN(ageNum) || ageNum < 3 || ageNum > 70) { Alert.alert("Invalid Age", "Age must be between 3 and 70 years."); return; }

    const newUser = { id: Date.now().toString(), name: inputName.trim(), age: ageNum };
    try {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(newUser));
      setUserData(newUser);
      setShowRegisterModal(false);
    } catch (e) { Alert.alert("Error", "Could not save profile."); }
  };

  const toggleMusic = async () => {
    if (!soundRef.current) return;
    const nextValue = !isSoundOn;
    setIsSoundOn(nextValue);
    try {
      nextValue ? await soundRef.current.playAsync() : await soundRef.current.pauseAsync();
      await AsyncStorage.setItem(SOUND_KEY, JSON.stringify(nextValue));
    } catch (e) { console.error("Toggle Error", e); }
  };

  const handleCategoryPress = useCallback((categoryName) => {
    router.push({ 
      pathname: '/quiz/levels', 
      params: { name: categoryName.toLowerCase(), difficulty: selectedDifficulty } 
    });
  }, [selectedDifficulty]);

  return (
    <View style={styles.container}>
      <BackgroundGlow />
      {Array.from({ length: 20 }).map((_, i) => <Star key={`star-${i}`} />)}

      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.title}>The Kenyan Trivia</Text>
        <TouchableOpacity onPress={() => setSettingsVisible(true)} style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={26} color="#9129d6" />
        </TouchableOpacity>
      </View>

      {userData && <Text style={styles.welcomeText}>Jambo, {userData.name}!</Text>}

      <SettingsModal 
        isVisible={isSettingsVisible} 
        onClose={() => setSettingsVisible(false)}
        isSoundOn={isSoundOn}
        onToggleMusic={toggleMusic}
        onResetComplete={() => router.push('/')}
      />

      {/* Registration Modal */}
      <Modal visible={showRegisterModal} animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.registrationContainer}>
          <Text style={styles.regTitle}>Karibu!</Text>
          <TextInput style={styles.input} placeholder="Your Name" placeholderTextColor="#94A3B8" value={inputName} onChangeText={setInputName} />
          <TextInput style={styles.input} placeholder="Age (3 - 70)" placeholderTextColor="#94A3B8" keyboardType="number-pad" value={inputAge} onChangeText={setInputAge} />
          <TouchableOpacity style={styles.startBtn} onPress={handleRegister}>
            <Text style={styles.startBtnText}>START CHALLENGE</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.difficultyButtonsContainer}>
          {DIFFICULTIES.map((diff) => (
            <TouchableOpacity
              key={diff.value}
              style={[styles.difficultyButton, selectedDifficulty === diff.value && { backgroundColor: diff.color, borderColor: diff.color }]}
              onPress={() => setSelectedDifficulty(diff.value)}
            >
              <Text style={[styles.difficultyButtonText, selectedDifficulty === diff.value && { color: '#FFF' }]}>{diff.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Choose Category</Text>
        <View style={styles.grid}>
          {CATEGORIES.map((item) => (
            <CategoryCard key={item.name} category={item} onPress={() => handleCategoryPress(item.name)} />
          ))}
        </View>
      </ScrollView> 
     
      {/* 2. SAFE RENDERING FOR EXPO GO */}
      {BannerAd ? (
        <BannerAd
          unitId={TestIds.BANNER}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          onAdFailedToLoad={(error) => console.log("Ad Load Failed:", error)}
        />
      ) : (
        <View style={{ height: 50, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#94A3B8', fontSize: 10 }}>Ad Placeholder (Expo Go)</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { paddingTop: 60, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 22, fontWeight: '900', color: '#9129d6' },
  welcomeText: { color: '#94A3B8', textAlign: 'center', fontSize: 14, marginBottom: 10, fontWeight: '600' },
  settingsBtn: { padding: 8, backgroundColor: 'rgba(200,105,165,0.05)', borderRadius: 12 },
  scrollContent: { paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#9129d6', marginBottom: 12, paddingHorizontal: 24, marginTop: 10 },
  difficultyButtonsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20, paddingHorizontal: 20 },
  difficultyButton: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
  difficultyButtonText: { color: '#94A3B8', fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, paddingHorizontal: 10 },
  registrationContainer: { flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', padding: 30 },
  regTitle: { fontSize: 36, fontWeight: '900', color: '#9129d6', textAlign: 'center', marginBottom: 40 },
  input: { backgroundColor: '#1E293B', borderRadius: 12, padding: 18, color: '#fff', marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  startBtn: { backgroundColor: '#9129d6', padding: 20, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  startBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
});
