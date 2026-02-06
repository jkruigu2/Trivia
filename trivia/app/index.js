import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated,
  Easing,
  Modal,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');
const GAP = 16;
const HORIZONTAL_PADDING = 20;
const availableWidth = width - HORIZONTAL_PADDING * 2;
const buttonWidth = (availableWidth - GAP) / 2;

// ────────────────────────────────────────────────
//  Background Glow Component
// ────────────────────────────────────────────────
const BackgroundGlow = () => (
  <View style={StyleSheet.absoluteFill}>
    <View style={[styles.glowOrb, { top: -height * 0.1, left: -width * 0.2, backgroundColor: '#4F46E5', width: width * 1.2, height: width * 1.2, opacity: 0.15 }]} />
    <View style={[styles.glowOrb, { bottom: height * 0.1, right: -width * 0.3, backgroundColor: '#E91E63', width: width, height: width, opacity: 0.1 }]} />
  </View>
);

// ────────────────────────────────────────────────
//  Animated Star Component
// ────────────────────────────────────────────────
const Star = ({ index }: { index: number }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;
  const size = 1.5 + Math.random() * 3;
  const left = Math.random() * width;

  useEffect(() => {
    const fall = () => {
      translateY.setValue(-100);
      Animated.timing(translateY, {
        toValue: height + 100,
        duration: 14000 + Math.random() * 22000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => fall());
    };
    fall();
  }, []);

  return <Animated.View style={[styles.starElement, { left, width: size, height: size, borderRadius: size / 2, transform: [{ translateY }], opacity }]} />;
};

// ────────────────────────────────────────────────
//  Main Home Screen
// ────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const [selectedDifficulty, setSelectedDifficulty] = useState('easy');
  const [isSettingsVisible, setSettingsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isSoundOn, setIsSoundOn] = useState(true);
  
  const [sound, setSound ] =useState(null)

  // 1. Setup Audio on Mount
  useEffect(() => {
    async function loadAndPlay() {
      try{
    if (!sound) {
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('./quiz/src/background.mp3'),
        { isLooping:true,shouldPlay:isSoundOn,volume:0.4}
      );
      setSound(newSound);
      await newSound.playAsync();
      setIsPlaying(true);
    }
    }
    catch(error){
      console.error('Promise Catch:', error);
    }
    }
    loadAndPlay()
  }, []);
  //to avoid sound leaks
  useEffect(() => {
    return sound ? () => sound.unloadAsync() : undefined;
  }, [sound]);

  
  const handleMusic = async ()=>{
    try{
     if(isSoundOn){
       await sound.pauseAsync()
     }else{
       await sound.playAsync()
     }
     setIsSoundOn(!isSoundOn)
  } catch(e) {
    console.error('Promise Catch:', );}
  }


  const difficulties = [
    { label: 'Easy', value: 'easy', questions: 10, color: '#4CAF50' },
    { label: 'Medium', value: 'medium', questions: 15, color: '#FF9800' },
    { label: 'Hard', value: 'hard', questions: 20, color: '#F44336' },
  ];

  const categories = [
    { name: 'Counties', color: '#3F51B5', icon: '🇰🇪' },
    { name: 'History', color: '#2196F3', icon: '🌅' },
    { name: 'Culture', color: '#F44336', icon: '📜' },
    { name: 'Geography', color: '#4CAF50', icon: '🏔️' },
    { name: 'World', color: '#607D8B', icon: '🌍' },
    { name: 'President', color: '#E91E63', icon: '👔' },
  ];

  const selectedInfo = difficulties.find((d) => d.value === selectedDifficulty) || difficulties[0];

  return (
    <View style={styles.container}>
      <BackgroundGlow />
      {Array.from({ length: 40 }).map((_, i) => <Star key={i} index={i} />)}

      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.title}>The Kenyan Trivia</Text>
        <TouchableOpacity onPress={() => setSettingsVisible(true)} style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={26} color="#F1F5F9" />
        </TouchableOpacity>
      </View>

      <Modal animationType="slide" transparent={true} visible={isSettingsVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentWhite}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleBlack}>Settings</Text>
              <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.settingRowBlack}>
              <Text style={styles.settingTextBlack}>Background Music</Text>
              <Switch 
                value={isSoundOn} 
                onValueChange={handleMusic} 
                trackColor={{ false: '#E2E8F0', true: '#4F46E5' }} 
              />
            </View>
            <View style={styles.settingRowBlack}>
              <Text style={styles.settingTextBlack}>Sound Effects</Text>
              <Switch trackColor={{ false: '#E2E8F0', true: '#4F46E5' }} />
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.categoriesScroll} contentContainerStyle={styles.categoriesContent}>
        <View style={styles.difficultyButtonsContainer}>
          {difficulties.map((diff) => (
            <TouchableOpacity
              key={diff.value}
              style={[styles.difficultyButton, selectedDifficulty === diff.value && { backgroundColor: diff.color, borderColor: diff.color }]}
              onPress={() => setSelectedDifficulty(diff.value)}
            >
              <Text style={[styles.difficultyButtonText, selectedDifficulty === diff.value && { color: '#ffffff' }]}>{diff.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.sectionTitle}>Choose Category</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.name}
              style={[styles.categoryButton, { backgroundColor: category.color + 'CC' }]}
              onPress={() => router.push({ pathname: '/quiz/levels', params: { name: category.name.toLowerCase(), difficulty: selectedDifficulty } })}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  glowOrb: { position: 'absolute', borderRadius: 999 },
  starElement: { position: 'absolute', backgroundColor: '#ffffff' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingsButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  title: { fontSize: 22, fontWeight: '900', color: '#F1F5F9' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContentWhite: { width: width * 0.85, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitleBlack: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  settingRowBlack: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  settingTextBlack: { color: '#334155', fontSize: 16, fontWeight: '600' },
  doneButton: { marginTop: 25, backgroundColor: '#4F46E5', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  doneButtonText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  difficultyButtonsContainer: { flexDirection: 'row', paddingHorizontal: 20, justifyContent: 'space-between', marginBottom: 20 },
  difficultyButton: { flex: 1, marginHorizontal: 6, paddingVertical: 12, borderRadius: 16, borderWidth: 1.5, borderColor: '#334155', alignItems: 'center' },
  difficultyButtonText: { fontSize: 15, fontWeight: '700', color: '#94A3B8' },
  categoriesScroll: { flex: 1 },
  categoriesContent: { paddingBottom: 40 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#CBD5E1', marginBottom: 16, paddingHorizontal: 24 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: HORIZONTAL_PADDING, gap: GAP },
  categoryButton: { width: buttonWidth, aspectRatio: 1, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  categoryIcon: { fontSize: 48, marginBottom: 8 },
  categoryName: { color: '#ffffff', fontSize: 16, fontWeight: '800', textAlign: 'center' },
});
