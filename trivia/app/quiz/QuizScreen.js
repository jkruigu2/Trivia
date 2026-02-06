import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  Easing,
  Alert,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { styles } from './styles';

const allData = require('./src/data.json');

export default function App() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOverReason, setGameOverReason] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [paused, setPaused] = useState(false);

  const intLevel = parseInt(params.level, 10);
  const quizData = allData.filter(q =>
    q.difficulty === params.difficulty &&
    q.category === params.name &&
    q.level === intLevel
  );

  const timePerQuestion = params.difficulty === "easy" ? 20 : params.difficulty === "medium" ? 15 : 10;
  const totalTime = quizData.length * timePerQuestion;
  const [timeLeft, setTimeLeft] = useState(totalTime);

  const timerRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // --- Automatic Best Time Check ---
  useEffect(() => {
    if (gameOverReason === 'completed' && score === questions.length) {
      checkAndSaveRecord();
    }
  }, [gameOverReason]);

  const checkAndSaveRecord = async () => {
    try {
      const timeSpent = totalTime - timeLeft;
      const key = `bestTime_${params.name}_${params.difficulty}_${params.level}`;
      const existing = await AsyncStorage.getItem(key);
      
      if (!existing || timeSpent < parseInt(existing, 10)) {
        await AsyncStorage.setItem(key, timeSpent.toString());
        
        // This will now trigger even if the level was already unlocked
        Alert.alert(
          "New Record! 🏆",
          existing 
            ? `You beat your old time of ${existing}s with a new best of ${timeSpent}s!` 
            : `First time completion! Best time set: ${timeSpent}s`
        );
      }
    } catch (e) { console.error(e); }
  };

  // --- Initialization ---
  useEffect(() => {
    if (!Array.isArray(quizData) || quizData.length === 0) {
      setError('No questions found');
      setLoading(false);
    } else {
      setQuestions(quizData);
      setLoading(false);
    }
  }, []);

  // --- Falling Stars Background ---
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const stars = useRef(Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * screenWidth,
    y: new Animated.Value(Math.random() * -screenHeight),
    size: Math.random() * 2 + 1,
    opacity: new Animated.Value(Math.random()),
    duration: Math.random() * 10000 + 10000,
  }))).current;

  useEffect(() => {
    stars.forEach(star => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(star.y, { toValue: screenHeight + 50, duration: star.duration, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(star.y, { toValue: -50, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  // --- Timer ---
  useEffect(() => {
    if (loading || gameOverReason || paused) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    timerRef.current = setTimeout(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { setGameOverReason('time_up'); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearTimeout(timerRef.current);
  }, [loading, gameOverReason, paused, timeLeft]);

  const handleAnswer = (selected) => {
    if (gameOverReason || selectedOption || paused) return;
    setSelectedOption(selected);
    const isCorrect = selected === questions[currentIndex].correct;
    setFeedback(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScore(s => s + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setTimeout(() => {
      const newLives = isCorrect ? lives : lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setGameOverReason('no_lives');
      } else if (currentIndex + 1 >= questions.length) {
        setGameOverReason('completed');
      } else {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setFeedback(null);
      }
    }, 1000);
  };

  const unlockNextLevel = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('levelData');
      let storageData = jsonValue ? JSON.parse(jsonValue) : {};
      const diffIdx = params.difficulty === 'easy' ? 0 : params.difficulty === 'medium' ? 1 : 2;
      
      if (!storageData[params.name]) storageData[params.name] = [1, 1, 1];
      if (storageData[params.name][diffIdx] <= intLevel) {
        storageData[params.name][diffIdx] = intLevel + 1;
        await AsyncStorage.setItem('levelData', JSON.stringify(storageData));
      }
      router.back();
    } catch (e) { console.error(e); }
  };

  const restart = () => {
    setCurrentIndex(0); setScore(0); setLives(3);
    setTimeLeft(totalTime); setGameOverReason(null);
    setSelectedOption(null); setFeedback(null); setPaused(false);
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;

  if (gameOverReason) {
    return (
      <GameOverScreen
        reason={gameOverReason}
        score={score}
        total={questions.length}
        timeTaken={totalTime - timeLeft}
        onRestart={restart}
        onUnlock={unlockNextLevel}
        params={params}
        intLevel={intLevel}
      />
    );
  }

  return (
    <View style={styles.container}>
      {stars.map(star => (
        <Animated.View key={star.id} style={[styles.star, { left: star.x, transform: [{ translateY: star.y }], opacity: star.opacity, width: star.size, height: star.size }]} />
      ))}
      <View style={styles.header}>
        <Text style={styles.headerLeft}>{currentIndex + 1}/{questions.length}</Text>
        <TouchableOpacity onPress={() => setPaused(!paused)}><Text style={styles.pauseText}>⏸</Text></TouchableOpacity>
        <Text style={[styles.timer, timeLeft < 10 && { color: 'red' }]}>{timeLeft}s</Text>
        <Text style={styles.livesText}>{'❤️'.repeat(lives)}</Text>
      </View>
      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{questions[currentIndex]?.question}</Text>
      </View>
      <View style={styles.optionsContainer}>
        {questions[currentIndex]?.options.map((option) => (
          <TouchableOpacity 
            key={option} 
            style={[styles.option, selectedOption === option && (feedback === 'correct' ? styles.optionCorrect : styles.optionWrong), selectedOption && option === questions[currentIndex].correct && styles.optionCorrect]}
            onPress={() => handleAnswer(option)}
            disabled={!!selectedOption}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {paused && <PauseModal onResume={() => setPaused(false)} onRestart={restart} />}
    </View>
  );
}

// --- SUB-COMPONENTS ---

function GameOverScreen({ reason, score, total, timeTaken, onRestart, onUnlock, params, intLevel }) {
  const router = useRouter(); // Initialize properly at top
  const [best, setBest] = useState(null);
  const [nextUnlocked, setNextUnlocked] = useState(false);
  const isPerfect = reason === 'completed' && score === total;

  useEffect(() => {
    const checkStatus = async () => {
      const timeVal = await AsyncStorage.getItem(`bestTime_${params.name}_${params.difficulty}_${params.level}`);
      setBest(timeVal);

      const progVal = await AsyncStorage.getItem('levelData');
      if (progVal) {
        const data = JSON.parse(progVal);
        const diffIdx = params.difficulty === 'easy' ? 0 : params.difficulty === 'medium' ? 1 : 2;
        if ((data[params.name]?.[diffIdx] || 1) > intLevel) setNextUnlocked(true);
      }
    };
    checkStatus();
  }, []);

  return (
    <SafeAreaView style={[styles.container, styles.center]}>
      <Text style={styles.gameOverTitle}>{isPerfect ? "Perfect Score!" : "Game Over"}</Text>
      <Text style={styles.finalScore}>{score} / {total}</Text>
      
      {isPerfect && nextUnlocked && <Text style={{ color: '#10B981', marginBottom: 10 }}>Next level is already unlocked!</Text>}
      {!isPerfect && <Text style={{ color: '#9CA3AF', marginBottom: 10 }}>Get 100% to unlock the next level.</Text>}

      <Text style={styles.statText}>Time: {timeTaken}s (Best: {best || '--'}s)</Text>

      {isPerfect && !nextUnlocked && (
        <TouchableOpacity style={[styles.restartBtn, { backgroundColor: '#10B981', marginBottom: 15 }]} onPress={onUnlock}>
          <Text style={styles.restartBtnText}>Unlock Next Level</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.restartBtn} onPress={onRestart}>
        <Text style={styles.restartBtnText}>Play Again</Text>
      </TouchableOpacity>

      <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.back()}>
        <Text style={{ color: '#6366F1', fontWeight: 'bold' }}>Back to Level</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function PauseModal({ onResume, onRestart }) {
  return (
    <View style={styles.pauseOverlay}>
      <View style={styles.modal}>
        <Text style={styles.modalTitle}>Paused</Text>
        <TouchableOpacity style={styles.modalBtn} onPress={onResume}><Text style={styles.modalBtnText}>RESUME</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#6366F1' }]} onPress={onRestart}><Text style={styles.modalBtnText}>RESTART</Text></TouchableOpacity>
      </View>
    </View>
  );
}

function LoadingScreen() { return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#6366F1" /></View>; }
function ErrorScreen({ message }) { return <View style={[styles.container, styles.center]}><Text style={styles.errorText}>{message}</Text></View>; }
