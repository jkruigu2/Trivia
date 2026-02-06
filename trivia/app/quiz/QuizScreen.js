import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { styles } from './styles';

const allData = require('./src/data.json');

export default function App() {
  const params = useLocalSearchParams();
  const router = useRouter();

  // --- Game State ---
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

  // --- Logic Helpers ---
  const intLevel = parseInt(params.level, 10);
  
  // Calculate max level for this specific category and difficulty
  const maxLevelAvailable = Math.max(
    ...allData
      .filter(q => q.category === params.name && q.difficulty === params.difficulty)
      .map(q => q.level),
    1
  );

  const quizData = allData.filter(q =>
    q.difficulty === params.difficulty &&
    q.category === params.name &&
    q.level === intLevel
  );

  const timePerQuestion = params.difficulty === "easy" ? 20 : params.difficulty === "medium" ? 15 : 10;
  const totalTime = quizData.length * timePerQuestion;
  const [timeLeft, setTimeLeft] = useState(totalTime);

  const timerRef = useRef(null);

  // --- Automation: Run when game ends ---
  useEffect(() => {
    if (gameOverReason === 'completed' && score === questions.length) {
      handleSuccessAutomation();
    }
  }, [gameOverReason]);

  const handleSuccessAutomation = async () => {
    try {
      // 1. Record High Score
      const timeSpent = totalTime - timeLeft;
      const timeKey = `bestTime_${params.name}_${params.difficulty}_${params.level}`;
      const existingTime = await AsyncStorage.getItem(timeKey);
      
      if (!existingTime || timeSpent < parseInt(existingTime, 10)) {
        await AsyncStorage.setItem(timeKey, timeSpent.toString());
        if (intLevel === maxLevelAvailable) {
          Alert.alert("Grand Finale! 🏆", `Final level cleared in ${timeSpent}s!`);
        } else {
          Alert.alert("New Record! 🏆", `You finished in ${timeSpent}s!`);
        }
      }

      // 2. Level Unlock (only if not at max)
      if (intLevel < maxLevelAvailable) {
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
    } catch (e) { console.error("Auto-save error:", e); }
  };

  // --- Initialization ---
  useEffect(() => {
    if (!Array.isArray(quizData) || quizData.length === 0) {
      setError('No questions found for this level.');
      setLoading(false);
    } else {
      setQuestions(quizData);
      setLoading(false);
    }
  }, [params.level]);

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setScore(s => s + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setTimeout(() => {
      const isLastQuestion = currentIndex + 1 >= questions.length;
      if (!isCorrect) setLives(prev => prev - 1);

      if (!isCorrect && lives - 1 <= 0) {
        setGameOverReason('no_lives');
      } else if (isLastQuestion) {
        setGameOverReason('completed');
      } else {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setFeedback(null);
      }
    }, 1000);
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
        params={params}
        intLevel={intLevel}
        maxLevel={maxLevelAvailable}
      />
    );
  }

  return (
    <View style={styles.container}>
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
            style={[
              styles.option, 
              selectedOption === option && (feedback === 'correct' ? styles.optionCorrect : styles.optionWrong), 
              selectedOption && option === questions[currentIndex].correct && styles.optionCorrect
            ]}
            onPress={() => handleAnswer(option)}
            disabled={!!selectedOption}
          >
            <Text style={option.length > 25 ? [styles.optionText, {fontSize: 14}] : styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {paused && <PauseModal onResume={() => setPaused(false)} onRestart={restart} />}
    </View>
  );
}

// --- SUB-COMPONENTS ---

function GameOverScreen({ reason, score, total, timeTaken, onRestart, params, intLevel, maxLevel }) {
  const router = useRouter();
  const [best, setBest] = useState(null);
  const [nextIsUnlocked, setNextIsUnlocked] = useState(false);
  
  const isPerfect = reason === 'completed' && score === total;
  const isLastLevel = intLevel >= maxLevel;

  useEffect(() => {
    const fetchStatus = async () => {
      const timeVal = await AsyncStorage.getItem(`bestTime_${params.name}_${params.difficulty}_${params.level}`);
      setBest(timeVal);

      const progVal = await AsyncStorage.getItem('levelData');
      if (progVal) {
        const data = JSON.parse(progVal);
        const diffIdx = params.difficulty === 'easy' ? 0 : params.difficulty === 'medium' ? 1 : 2;
        if ((data[params.name]?.[diffIdx] || 1) > intLevel) setNextIsUnlocked(true);
      }
    };
    fetchStatus();
  }, [params.level]);

  const handleNextLevel = () => {
    const nextLevel = (intLevel + 1).toString();
    router.replace({
      pathname: "/quiz/QuizScreen", 
      params: { ...params, level: nextLevel }
    });
  };

  return (
    <SafeAreaView style={[styles.container, styles.center]}>
      <Text style={styles.gameOverTitle}>
        {isPerfect && isLastLevel ? "Category Mastered! 🎉" : isPerfect ? "Perfect Score!" : "Game Over"}
      </Text>
      <Text style={styles.finalScore}>{score} / {total}</Text>
      <Text style={styles.statText}>Current: {timeTaken}s | Best: {best || '--'}s</Text>

      {/* Logic for the Next Level Button vs Mastered Text */}
      {isPerfect && !isLastLevel ? (
        <TouchableOpacity 
          style={[styles.restartBtn, { backgroundColor: '#10B981', marginBottom: 15 }]} 
          onPress={handleNextLevel}
        >
          <Text style={styles.restartBtnText}>Next Level</Text>
        </TouchableOpacity>
      ) : isPerfect && isLastLevel ? (
        <View style={{ backgroundColor: '#FEF3C7', padding: 15, borderRadius: 10, marginBottom: 15 }}>
          <Text style={{ color: '#D97706', fontWeight: 'bold' }}>✨ All levels completed! ✨</Text>
        </View>
      ) : nextIsUnlocked && !isLastLevel ? (
        <TouchableOpacity 
          style={[styles.restartBtn, { backgroundColor: '#10B981', marginBottom: 15 }]} 
          onPress={handleNextLevel}
        >
          <Text style={styles.restartBtnText}>Next Level</Text>
        </TouchableOpacity>
      ) : (
        !isLastLevel && <Text style={{ color: '#ef4444', marginBottom: 15 }}>Score 100% to unlock Level {intLevel + 1}</Text>
      )}

      <TouchableOpacity 
        style={[styles.restartBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#6366F1' }]} 
        onPress={onRestart}
      >
        <Text style={[styles.restartBtnText, { color: '#6366F1' }]}>Try Level {intLevel} Again</Text>
      </TouchableOpacity>

      <TouchableOpacity style={{ marginTop: 30 }} onPress={() => router.back()}>
        <Text style={{ color: '#9CA3AF' }}>Exit to Menu</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function PauseModal({ onResume, onRestart }) {
  const router = useRouter();
  return (
    <View style={styles.pauseOverlay}>
      <View style={styles.modal}>
        <Text style={styles.modalTitle}>Paused</Text>
        <TouchableOpacity style={styles.modalBtn} onPress={onResume}><Text style={styles.modalBtnText}>RESUME</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#6366F1' }]} onPress={onRestart}><Text style={styles.modalBtnText}>RESTART</Text></TouchableOpacity>
        <TouchableOpacity style={{marginTop: 15}} onPress={() => router.back()}><Text style={{color: '#ef4444'}}>QUIT</Text></TouchableOpacity>
      </View>
    </View>
  );
}

function LoadingScreen() { return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#6366F1" /></View>; }
function ErrorScreen({ message }) { 
  const router = useRouter();
  return (
    <View style={[styles.container, styles.center]}>
      <Text style={styles.errorText}>{message}</Text>
      <TouchableOpacity onPress={() => router.back()} style={{marginTop: 20}}><Text style={{color: '#6366F1'}}>Go Back</Text></TouchableOpacity>
    </View>
  ); 
}
