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
import { styles } from './styles'

const { height, width, GAP,HORIZONTAL_PADDING,availableWidth,buttonWidth} = styles;

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
