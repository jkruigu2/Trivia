import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

// Subcomponents
import { BackgroundGlow, Star } from './components/BackgroundEffects';
import { SettingsModal } from './components/SettingsModal';
import { CategoryCard } from './components/CategoryCard';

export default function HomeScreen() {
  const router = useRouter();
  const [selectedDifficulty, setSelectedDifficulty] = useState('easy');
  const [isSettingsVisible, setSettingsVisible] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [sound, setSound] = useState(null);

  // Audio setup
  useEffect(() => {
    async function loadAudio() {
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          require('./quiz/src/background.mp3'),
          { isLooping: true, shouldPlay: isSoundOn, volume: 0.4 }
        );
        setSound(newSound);
      } catch (e) { console.error("Audio Load Error", e); }
    }
    loadAudio();
    return () => { if (sound) sound.unloadAsync(); };
  }, []);

  const toggleMusic = async () => {
    if (!sound) return;
    isSoundOn ? await sound.pauseAsync() : await sound.playAsync();
    setIsSoundOn(!isSoundOn);
  };

  const categories = [
    { name: 'Counties', color: '#3F51B5', icon: '🇰🇪' },
    { name: 'History', color: '#2196F3', icon: '🌅' },
    { name: 'Culture', color: '#F44336', icon: '📜' },
    { name: 'Geography', color: '#4CAF50', icon: '🏔️' },
    { name: 'World', color: '#607D8B', icon: '🌍' },
    { name: 'President', color: '#E91E63', icon: '👔' },
  ];

  return (
    <View style={styles.container}>
      <BackgroundGlow />
      {Array.from({ length: 30 }).map((_, i) => <Star key={i} />)}

      {/* Header */}
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
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
  header: { paddingTop: 60, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '900', color: '#F1F5F9' },
  settingsBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  scrollContent: { paddingBottom: 40, paddingTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#CBD5E1', marginBottom: 16, paddingHorizontal: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
});
