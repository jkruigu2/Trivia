import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View, StyleSheet, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// Updated props: replaced timeLeft/totalTime with timeUsed
export default function GameOverScreen({ reason, score, total, timeUsed, params, onRestart, maxLevel }) {
  const router = useRouter();
  const [best, setBest] = useState(null);
  const intLevel = parseInt(params.level, 10);
  const category = params.name || 'Adventure';
  const difficulty = params.difficulty || 'Easy';

  const saveProgress = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('levelData');
      let data = jsonValue != null ? JSON.parse(jsonValue) : {};

      // Initialize nested structure
      if (!data[category]) data[category] = {};
      if (!data[category][difficulty]) {
        data[category][difficulty] = {
          unlocked: 1,
          scores: Array(9).fill(0),
          times: Array(9).fill(null),
        };
      }

      const currentStats = data[category][difficulty];
      const levelIdx = intLevel - 1;

      // 1. Update High Score (Percentage)
      const currentScorePercent = Math.round((score / total) * 100);
      if (currentScorePercent > (currentStats.scores[levelIdx] || 0)) {
        currentStats.scores[levelIdx] = currentScorePercent;
      }

      // 2. Update Best Time (Using timeUsed directly)
      const previousBest = currentStats.times[levelIdx];
      if (previousBest === null || timeUsed < previousBest) {
        currentStats.times[levelIdx] = timeUsed;
        setBest(timeUsed);
      } else {
        setBest(previousBest);
      }

      // 3. Unlock Next Level (if current level is cleared perfectly)
      if (score === total && intLevel === currentStats.unlocked && intLevel < maxLevel) {
        currentStats.unlocked = intLevel + 1;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      await AsyncStorage.setItem('levelData', JSON.stringify(data));
    } catch (e) {
      console.error("Save Progress Error:", e);
    }
  };

  const fetchBest = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('levelData');
      if (jsonValue) {
        const data = JSON.parse(jsonValue);
        const savedTime = data[category]?.[difficulty]?.times[intLevel - 1];
        setBest(savedTime);
      }
    } catch (e) {
      console.error("Fetch Best Error:", e);
    }
  };

  useEffect(() => {
    // Only save if the game was actually completed with some points
    if (reason === 'completed' && score > 0) {
      saveProgress();
    } else {
      fetchBest();
    }
  }, []);

  const isPerfect = score === total;

  return (
    <SafeAreaView style={styles.container}>
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2D1B4E', justifyContent: 'center', alignItems: 'center' },
  card: { width: width * 0.85, backgroundColor: '#3D2B5E', borderRadius: 30, padding: 30, alignItems: 'center', borderWidth: 2, borderColor: '#F472B6', elevation: 10 },
  gameOverTitle: { fontSize: 32, fontWeight: '900', color: '#F472B6', marginBottom: 20, textAlign: 'center', letterSpacing: 2 },
  scoreContainer: { alignItems: 'center', marginBottom: 30 },
  scoreLabel: { color: '#A78BFA', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  levelLabel: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginTop: 5 },
  finalScore: { fontSize: 54, fontWeight: 'bold', color: '#FFFFFF' },
  totalScore: { fontSize: 24, color: '#A78BFA' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 40 },
  statBox: { alignItems: 'center', flex: 1 },
  statLabel: { color: '#F9A8D4', fontSize: 12, marginBottom: 5 },
  statValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '600' },
  restartBtn: { backgroundColor: '#EC4899', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 100, width: '100%', alignItems: 'center', marginBottom: 15 },
  restartBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase' },
  menuBtn: { padding: 10 },
  menuBtnText: { color: '#A78BFA', fontSize: 16, fontWeight: '500' }
});
