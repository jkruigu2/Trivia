import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View, StyleSheet, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function GameOverScreen({ reason, score, total, timeLeft, totalTime, params, onRestart, maxLevel }) {
  const router = useRouter();
  const [best, setBest] = useState(null);
  const intLevel = parseInt(params.level, 10);

  
  const saveProgress = async () => {
    const timeSpent = totalTime - timeLeft;
    const timeKey = `bestTime_${params.name}_${params.difficulty}_${params.level}`;
    
    const existingTime = await AsyncStorage.getItem(timeKey);
    if (!existingTime || timeSpent < parseInt(existingTime, 10)) {
      await AsyncStorage.setItem(timeKey, timeSpent.toString());
      setBest(timeSpent);
    }

    if (intLevel < maxLevel) {
      const jsonValue = await AsyncStorage.getItem('levelData');
      let storageData = jsonValue ? JSON.parse(jsonValue) : {};
      const diffIdx = params.difficulty === 'easy' ? 0 : params.difficulty === 'medium' ? 1 : 2;
      
      if (!storageData[params.name]) storageData[params.name] = [1, 1, 1];
      if (storageData[params.name][diffIdx] <= intLevel) {
        storageData[params.name][diffIdx] = intLevel + 1;
        await AsyncStorage.setItem('levelData', JSON.stringify(storageData));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  const fetchBest = async () => {
    const timeVal = await AsyncStorage.getItem(`bestTime_${params.name}_${params.difficulty}_${params.level}`);
    setBest(timeVal);
  };

useEffect(() => {
    if (reason === 'completed' && score === total) {
      saveProgress();
    } else {
      fetchBest();
      console.log("Best",best)
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
          <Text style={styles.scoreLabel}>Final Score   </Text>
            <Text style={styles.scoreLabel}>Category: { params.name }{ params.difficulty } Level: { params.level} </Text>
          <Text style={styles.finalScore}>{score} <Text style={styles.totalScore}>/ {total}</Text></Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Current Time</Text>
            <Text style={styles.statValue}>{totalTime - timeLeft}s</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Best Time</Text>
            <Text style={styles.statValue}>{best ? `${best}s` : '--'}</Text>
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
          <Text style={styles.menuBtnText}>Back to Menu</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D1B4E', // Deep purple background
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: width * 0.85,
    backgroundColor: '#3D2B5E', // Lighter purple card
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F472B6', // Pink border
    shadowColor: '#F472B6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F472B6', // Bright Pink
    marginBottom: 20,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  scoreLabel: {
    color: '#A78BFA', // Soft Lavender
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  finalScore: {
    fontSize: 54,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  totalScore: {
    fontSize: 24,
    color: '#A78BFA',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: '#F9A8D4', // Light Pink
    fontSize: 12,
    marginBottom: 5,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  restartBtn: {
    backgroundColor: '#EC4899', // Strong Pink
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 100,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  restartBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  menuBtn: {
    padding: 10,
  },
  menuBtnText: {
    color: '#A78BFA',
    fontSize: 16,
    fontWeight: '500',
  }
});
