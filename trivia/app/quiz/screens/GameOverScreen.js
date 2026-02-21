import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View, StyleSheet, Dimensions, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function GameOverScreen({ reason, score, total, timeUsed, params, onRestart, maxLevel }) {
  const router = useRouter();
  const [best, setBest] = useState(null);
  
  // Chip State
  const [showChip, setShowChip] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const intLevel = parseInt(params.level, 10);
  const category = params.name || 'Adventure';
  const difficulty = params.difficulty || 'Easy';
  const isPerfect = score === total;

  const triggerHighestScoreChip = () => {
    setShowChip(true);
    fadeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start(() => setShowChip(false));
  };

  const saveProgress = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('levelData');
      let data = jsonValue != null ? JSON.parse(jsonValue) : {};

      if (!data[category]) data[category] = {};
      if (!data[category][difficulty]) {
        data[category][difficulty] = { unlocked: 1, scores: Array(9).fill(0), times: Array(9).fill(null) };
      }

      const currentStats = data[category][difficulty];
      const levelIdx = intLevel - 1;
      const previousBestScore = currentStats.scores[levelIdx] || 0;
      const previousBestTime = currentStats.times[levelIdx];
      const currentScorePercent = Math.round((score / total) * 100);

      // --- RECORD BREAKING LOGIC ---
      
      // Trigger "Highest Score" Chip if Perfect AND Time is improved
      if (isPerfect && (previousBestTime === null || timeUsed < previousBestTime)) {
        triggerHighestScoreChip();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (currentScorePercent > previousBestScore) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Silent Reward for first-time 100%
      if (isPerfect && previousBestScore < 100) {
        await awardGems(5);
      }

      // Update Stats
      if (currentScorePercent > previousBestScore) {
        currentStats.scores[levelIdx] = currentScorePercent;
      }

      if (score > 0 && (previousBestTime === null || timeUsed < previousBestTime)) {
        currentStats.times[levelIdx] = timeUsed;
        setBest(timeUsed);
      } else {
        setBest(previousBestTime);
      }

      if (isPerfect && intLevel === currentStats.unlocked && intLevel < maxLevel) {
        currentStats.unlocked = intLevel + 1;
      }

      await AsyncStorage.setItem('levelData', JSON.stringify(data));
    } catch (e) {
      console.error("Save Progress Error:", e);
    }
  };

  const awardGems = async (amount) => {
    try {
      const currentGems = await AsyncStorage.getItem('totalGems');
      const totalGems = (parseInt(currentGems, 10) || 0) + amount;
      await AsyncStorage.setItem('totalGems', totalGems.toString());
    } catch (e) { console.error(e); }
  };

  const fetchBest = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('levelData');
      if (jsonValue) {
        const data = JSON.parse(jsonValue);
        setBest(data[category]?.[difficulty]?.times[intLevel - 1]);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (reason === 'completed') {
      saveProgress();
    } else {
      fetchBest();
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* HIGHEST SCORE CHIP */}
      {showChip && (
        <Animated.View style={[styles.highestScoreChip, { opacity: fadeAnim }]}>
          <Text style={styles.chipText}>⭐ Highest Score! ⭐</Text>
        </Animated.View>
      )}

      <View style={styles.card}>
        <Text style={styles.gameOverTitle}>
          {isPerfect ? "MAJESTIC! ✨" : "KEEP GOING!"}
        </Text>
        
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>{category} • {difficulty}</Text>
          <Text style={styles.levelLabel}>Level {intLevel}</Text>
          <Text style={styles.finalScore}>{score} <Text style={styles.totalScore}>/ {total}</Text></Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Time Spent</Text>
            <Text style={styles.statValue}>{timeUsed}s</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Best Time</Text>
            <Text style={styles.statValue}>{best !== null ? `${best}s` : '--'}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.restartBtn} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onRestart();
          }}
        >
          <Text style={styles.restartBtnText}>Play Again</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuBtn} onPress={() => router.back()}>
          <Text style={styles.menuBtnText}>Back to Map</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Powered by </Text>
          <Text style={styles.brandText}>Lim Technologies</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2D1B4E', justifyContent: 'center', alignItems: 'center' },
  highestScoreChip: {
    position: 'absolute',
    top: 50,
    backgroundColor: '#FACC15',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 50,
    zIndex: 100,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  chipText: { color: '#2D1B4E', fontWeight: '900', fontSize: 16 },
  card: { width: width * 0.85, backgroundColor: '#3D2B5E', borderRadius: 30, padding: 30, alignItems: 'center', borderWidth: 2, borderColor: '#F472B6' },
  gameOverTitle: { fontSize: 32, fontWeight: '900', color: '#F472B6', marginBottom: 20, textAlign: 'center' },
  scoreContainer: { alignItems: 'center', marginBottom: 30 },
  scoreLabel: { color: '#A78BFA', fontSize: 14, textTransform: 'uppercase' },
  levelLabel: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginTop: 5 },
  finalScore: { fontSize: 54, fontWeight: 'bold', color: '#FFFFFF' },
  totalScore: { fontSize: 24, color: '#A78BFA' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 40 },
  statBox: { alignItems: 'center', flex: 1 },
  statLabel: { color: '#F9A8D4', fontSize: 12, marginBottom: 5 },
  statValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '600' },
  restartBtn: { backgroundColor: '#EC4899', paddingVertical: 15, borderRadius: 100, width: '100%', alignItems: 'center', marginBottom: 15 },
  restartBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  menuBtn: { padding: 10 },
  menuBtnText: { color: '#A78BFA', fontSize: 16, fontWeight: '500' },
  footer: { marginTop: 25, flexDirection: 'row', opacity: 0.6 },
  footerText: { fontSize: 10, color: '#A78BFA' },
  brandText: { fontSize: 10, color: '#FACC15', fontWeight: 'bold' }
});
