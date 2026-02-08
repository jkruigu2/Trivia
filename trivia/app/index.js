import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BackgroundGlow, Star } from './components/BackgroundEffects';
import { SettingsModal } from './components/SettingsModal';
import { CategoryCard } from './components/CategoryCard';

const SOUND_KEY = 'soundStatus';

export default function HomeScreen() {
  const router = useRouter();
  const [selectedDifficulty, setSelectedDifficulty] = useState('easy');
  const [isSettingsVisible, setSettingsVisible] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const soundRef = useRef(null); // Use a ref to keep track of the sound object without triggering re-renders

<<<<<<< HEAD
  const difficulties = [
    { label: 'Easy', value: 'easy', color: '#4CAF50' },
    { label: 'Medium', value: 'medium', color: '#FF9800' },
    { label: 'Hard', value: 'hard', color: '#F44336' },
  ];

  const categories = [
    { name: 'Counties', color: '#3F51B5', icon: '🇰🇪' },
    { name: 'History', color: '#2196F3', icon: '🌅' },
    { name: 'Culture', color: '#F44336', icon: '📜' },
    { name: 'Geography', color: '#4CAF50', icon: '🏔️' },
    { name: 'World', color: '#607D8B', icon: '🌍' },
    { name: 'President', color: '#E91E63', icon: '👔' },
  ];

=======
  // 1. Initial Load: Get saved settings and load audio
>>>>>>> c3205ae2f96f6b4e47890e59f3b7c81372da490b
  useEffect(() => {
    async function init() {
      try {
        // Get saved preference
        const savedStatus = await AsyncStorage.getItem(SOUND_KEY);
        // If null, default to true. Otherwise, parse the boolean.
        const soundEnabled = savedStatus !== null ? JSON.parse(savedStatus) : true;
        setIsSoundOn(soundEnabled);

        // Create Sound
        const { sound } = await Audio.Sound.createAsync(
          require('./quiz/src/background.mp3'),
          { isLooping: true, shouldPlay: soundEnabled, volume: 0.4 }
        );
        soundRef.current = sound;
      } catch (e) {
        console.error("Initialization Error", e);
      }
    }
    init();

    return () => {
      if (soundRef.current) soundRef.current.unloadAsync();
    };
  }, []);

  // 2. Optimized Toggle Logic
  const toggleMusic = async () => {
    if (!soundRef.current) return;

    const nextValue = !isSoundOn; // Determine next state immediately
    setIsSoundOn(nextValue);
    
    try {
      if (nextValue) {
        await soundRef.current.playAsync();
      } else {
        await soundRef.current.pauseAsync();
      }
      // Save as boolean string "true" or "false"
      await AsyncStorage.setItem(SOUND_KEY, JSON.stringify(nextValue));
    } catch (e) {
      console.error("Toggle Error", e);
    }
  };

  return (
    <View style={styles.container}>
      <BackgroundGlow />
      {Array.from({ length: 20 }).map((_, i) => <Star key={i} />)}

      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.title}>The Kenyan Trivia</Text>
        <TouchableOpacity onPress={() => setSettingsVisible(true)} style={styles.settingsBtn}>
          <Ionicons name="settings-outline" size={26} color="#F1F5F9" />
        </TouchableOpacity>
      </View>

      <SettingsModal 
        isVisible={isSettingsVisible} 
        onClose={() => setSettingsVisible(false)}
        isSoundOn={isSoundOn}
        onToggleMusic={toggleMusic}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Difficulty Selection */}
        <Text style={styles.sectionTitle}>Select Difficulty</Text>
        <View style={styles.difficultyButtonsContainer}>
          {difficulties.map((diff) => (
            <TouchableOpacity
              key={diff.value}
              style={[
                styles.difficultyButton, 
                selectedDifficulty === diff.value && { backgroundColor: diff.color, borderColor: diff.color }
              ]}
              onPress={() => setSelectedDifficulty(diff.value)}
            >
              <Text style={[
                styles.difficultyButtonText, 
                selectedDifficulty === diff.value && { color: '#ffffff' }
              ]}>{diff.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Categories Grid */}
        <Text style={styles.sectionTitle}>Choose Category</Text>
        <View style={styles.grid}>
          {categories.map((item) => (
            <CategoryCard 
              key={item.name} 
              category={item} 
              onPress={() => router.push({ 
                pathname: '/quiz/levels', 
                params: { name: item.name.toLowerCase(), difficulty: selectedDifficulty } 
              })} 
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { paddingTop: 60, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '900', color: '#F1F5F9' },
  settingsBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  scrollContent: { paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#CBD5E1', marginBottom: 12, paddingHorizontal: 24, marginTop: 10 },
  difficultyButtonsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20, paddingHorizontal: 20 },
  difficultyButton: { 
    flex: 1, 
    paddingVertical: 10, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#334155', 
    alignItems: 'center' 
  },
  difficultyButtonText: { color: '#94A3B8', fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, paddingHorizontal: 10 },
});
