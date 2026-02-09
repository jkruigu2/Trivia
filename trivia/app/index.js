import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BackgroundGlow, Star } from './components/BackgroundEffects';
import { SettingsModal } from './components/SettingsModal';
import { CategoryCard } from './components/CategoryCard';

const SOUND_KEY = 'soundStatus';

// Static data outside the component to prevent re-creation on every render
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

  // Initialize Audio and Settings
  useEffect(() => {
    let isMounted = true;

    async function initAudio() {
      try {
        const savedStatus = await AsyncStorage.getItem(SOUND_KEY);
        const soundEnabled = savedStatus !== null ? JSON.parse(savedStatus) : true;
        
        if (isMounted) setIsSoundOn(soundEnabled);

        const { sound } = await Audio.Sound.createAsync(
          require('./quiz/src/background.mp3'),
          { isLooping: true, shouldPlay: soundEnabled, volume: 0.4 }
        );
        
        soundRef.current = sound;
      } catch (e) {
        console.error("Audio Init Error:", e);
      }
    }

    initAudio();

    return () => {
      isMounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Optimized Toggle Logic
  const toggleMusic = async () => {
    if (!soundRef.current) return;

    const nextValue = !isSoundOn;
    setIsSoundOn(nextValue);
    
    try {
      if (nextValue) {
        await soundRef.current.playAsync();
      } else {
        await soundRef.current.pauseAsync();
      }
      await AsyncStorage.setItem(SOUND_KEY, JSON.stringify(nextValue));
    } catch (e) {
      console.error("Toggle Error", e);
    }
  };

  // Navigate to levels
  const handleCategoryPress = useCallback((categoryName) => {
    router.push({ 
      pathname: '/quiz/levels', 
      params: { name: categoryName.toLowerCase(), difficulty: selectedDifficulty } 
    });
  }, [selectedDifficulty]);

  return (
    <View style={styles.container}>
      <BackgroundGlow />
      {/* Optimization: Static star array to avoid re-calculating on every render */}
      {Array.from({ length: 20 }).map((_, i) => <Star key={`star-${i}`} />)}

      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.title}>The Kenyan Trivia</Text>
        <TouchableOpacity 
          onPress={() => setSettingsVisible(true)} 
          style={styles.settingsBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={26} color="#9129d6" />
        </TouchableOpacity>
      </View>

      <SettingsModal 
        isVisible={isSettingsVisible} 
        onClose={() => setSettingsVisible(false)}
        isSoundOn={isSoundOn}
        onToggleMusic={toggleMusic}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.difficultyButtonsContainer}>
          {DIFFICULTIES.map((diff) => {
            const isActive = selectedDifficulty === diff.value;
            return (
              <TouchableOpacity
                key={diff.value}
                style={[
                  styles.difficultyButton, 
                  isActive && { backgroundColor: diff.color, borderColor: diff.color }
                ]}
                onPress={() => setSelectedDifficulty(diff.value)}
              >
                <Text style={[
                  styles.difficultyButtonText, 
                  isActive && styles.activeButtonText
                ]}>
                  {diff.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Choose Category</Text>
        <View style={styles.grid}>
          {CATEGORIES.map((item) => (
            <CategoryCard 
              key={item.name} 
              category={item} 
              onPress={() => handleCategoryPress(item.name)} 
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { 
    paddingTop: 60, 
    paddingHorizontal: 24, 
    flexDirection: 'row', 
    alignItems: 'centre', 
    justifyContent: 'space-between', 
    marginBottom: 20 
  },
  title: { fontFamily:'Pacifico',fontSize: 22, fontWeight: '900', color: '#9129d6' },
  settingsBtn: { 
    padding: 8, 
    backgroundColor: 'rgba(200,105,165,0.05)', 
    borderRadius: 12 
  },
  scrollContent: { paddingBottom: 40 },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#9129d6', 
    marginBottom: 12, 
    paddingHorizontal: 24, 
    marginTop: 10 
  },
  difficultyButtonsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: 10, 
    marginBottom: 20, 
    paddingHorizontal: 20 
  },
  difficultyButton: { 
    flex: 1, 
    paddingVertical: 10, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#ffffff', 
    alignItems: 'center' 
  },
  difficultyButtonText: { color: '#94A3B8', fontWeight: '600' },
  activeButtonText: { color: '#9129d6' },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'center', 
    gap: 16, 
    paddingHorizontal: 10 
  },
});