import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { styles } from '../styles';

export default function GameOverScreen({ reason, score, total, timeLeft, totalTime, params, onRestart, maxLevel }) {
  const router = useRouter();
  const [best, setBest] = useState(null);
  const intLevel = parseInt(params.level, 10);

  useEffect(() => {
    if (reason === 'completed' && score === total) {
      saveProgress();
    } else {
      fetchBest();
    }
  }, []);

  const saveProgress = async () => {
    const timeSpent = totalTime - timeLeft;
    const timeKey = `bestTime_${params.name}_${params.difficulty}_${params.level}`;
    
    // Save High Score
    const existingTime = await AsyncStorage.getItem(timeKey);
    if (!existingTime || timeSpent < parseInt(existingTime, 10)) {
      await AsyncStorage.setItem(timeKey, timeSpent.toString());
      setBest(timeSpent);
    }

    // Unlock Next Level
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

  return (
    <SafeAreaView style={[styles.container, styles.center]}>
      <Text style={styles.gameOverTitle}>{score === total ? "Perfect! 🎉" : "Game Over"}</Text>
      <Text style={styles.finalScore}>{score} / {total}</Text>
      <Text style={styles.statText}>Best Time: {best ? `${best}s` : '--'}</Text>

      <TouchableOpacity style={styles.restartBtn} onPress={onRestart}>
        <Text style={styles.restartBtnText}>Try Again</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={{ marginTop: 20, color: '#6366F1' }}>Back to Menu</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}