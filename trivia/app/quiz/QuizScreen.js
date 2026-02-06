import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  Easing,
  Alert,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './styles'

const allData = require('./src/data.json');

export default function App() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const intLevel = parseInt(params.level, 10);
  const quizData = allData.filter(q =>
    q.difficulty === params.difficulty &&
    q.category === params.name &&
    q.level === intLevel
  );

  const timePerQuestion = params.difficulty === "easy" ? 20 : params.difficulty === "medium" ? 15 : 10;
  const totalTime = quizData.length * timePerQuestion;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [gameOverReason, setGameOverReason] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [paused, setPaused] = useState(false);

  const timerRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // ── Falling stars background ───────────────────────────────────────
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const numStars = 50;

  const stars = useRef(
    Array.from({ length: numStars }, (_, i) => ({
      id: i,
      x: Math.random() * screenWidth,
      y: new Animated.Value(Math.random() * -screenHeight - 100),
      size: Math.random() * 3 + 1.2,
      opacity: new Animated.Value(Math.random() * 0.4 + 0.4),
      delay: Math.random() * 8000,
      duration: Math.random() * 10000 + 14000, // 14–24 seconds fall
    }))
  ).current;

  useEffect(() => {
    const animations = stars.map(star => {
      return Animated.loop(
        Animated.sequence([
          // Twinkle
          Animated.timing(star.opacity, {
            toValue: 0.15,
            duration: 1400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(star.opacity, {
            toValue: Math.random() * 0.4 + 0.6,
            duration: 1800,
            useNativeDriver: true,
          }),
          // Fall
          Animated.timing(star.y, {
            toValue: screenHeight + 100,
            duration: star.duration,
            easing: Easing.linear,
            useNativeDriver: true,
            delay: star.delay,
          }),
          // Reset to top
          Animated.timing(star.y, {
            toValue: -100,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    });

    animations.forEach(anim => anim.start());

    return () => {
      animations.forEach(anim => anim.stop());
    };
  }, []);

  useEffect(() => {
    if (!Array.isArray(quizData) || quizData.length === 0) {
      setError('No questions found for this level');
      setLoading(false);
    } else {
      setQuestions(quizData);
      setLoading(false);
    }
  }, [params.name, params.level]);

  const tick = () => {
    if (paused || gameOverReason) return;

    setTimeLeft((prev) => {
      if (prev <= 1) {
        setGameOverReason('time_up');
        return 0;
      }
      return prev - 1;
    });

    timerRef.current = setTimeout(tick, 1000);
  };

  useEffect(() => {
    if (loading || gameOverReason || paused) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    timerRef.current = setTimeout(tick, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [loading, gameOverReason, paused, timeLeft]);

  const handleAnswer = (selected) => {
    if (gameOverReason || selectedOption || paused) return;

    setSelectedOption(selected);
    const current = questions[currentIndex];
    const isCorrect = selected === current.correct;
    setFeedback(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      setScore((prev) => prev + 1);
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.08, duration: 120, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]).start();
    }

    setTimeout(() => {
      const newLives = isCorrect ? lives : Math.max(0, lives - 1);
      setLives(newLives);

      if (newLives <= 0) {
        setGameOverReason('no_lives');
      } else if (currentIndex + 1 >= questions.length) {
        setGameOverReason('completed');
      } else {
        setCurrentIndex((prev) => prev + 1);
        setSelectedOption(null);
        setFeedback(null);
      }
    }, 1200);
  };

  const saveBestTime = async () => {
    try {
      const timeSpent = totalTime - timeLeft;
      const key = `bestTime_\( {params.name}_ \){params.difficulty}_${params.level}`;
      const existing = await AsyncStorage.getItem(key);
      if (!existing || timeSpent < parseInt(existing, 10)) {
        await AsyncStorage.setItem(key, timeSpent.toString());
      }
    } catch (e) { console.error(e); }
  };

  const saveProgressToStorage = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('levelData');
      let storageData = jsonValue ? JSON.parse(jsonValue) : {
        science: [1, 1, 1], technology: [1, 1, 1], sports: [1, 1, 1],
        president: [1, 1, 1], history: [1, 1, 1], geography: [1, 1, 1]
      };
      const diffIdx = params.difficulty === 'easy' ? 0 : params.difficulty === 'medium' ? 1 : 2;

      if (!storageData[params.name]) storageData[params.name] = [1, 1, 1];

      if (storageData[params.name][diffIdx] <= intLevel) {
        storageData[params.name][diffIdx] = intLevel + 1;
        await AsyncStorage.setItem('levelData', JSON.stringify(storageData));
      }
    } catch (e) { console.error(e); }
  };

  const updateLevel = async () => {
    await saveBestTime();
    await saveProgressToStorage();
    Alert.alert("Congrats!", `Level ${intLevel + 1} unlocked!`, [
      { text: "Play Again", onPress: restart },
      { text: "Go to Levels", onPress: () => router.back() }
    ]);
  };

  const restart = () => {
    setCurrentIndex(0);
    setScore(0);
    setLives(3);
    setTimeLeft(totalTime);
    setGameOverReason(null);
    setSelectedOption(null);
    setFeedback(null);
    setPaused(false);
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
        levelUp={updateLevel}
        params={params}
      />
    );
  }

  return (
    <View style={[styles.container, { position: 'relative' }]}>
      {/* Falling stars layer */}
      {stars.map(star => (
        <Animated.View
          key={star.id}
          style={{
            position: 'absolute',
            left: star.x,
            transform: [{ translateY: star.y }],
            opacity: star.opacity,
            width: star.size,
            height: star.size,
            borderRadius: star.size / 2,
            backgroundColor: '#ffffff',
            shadowColor: '#ffffff',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.95,
            shadowRadius: star.size * 1.5,
            elevation: 6,
          }}
        />
      ))}

      {/* Main game content */}
      <View style={styles.header}>
        <Text style={styles.headerLeft}>{currentIndex + 1}/{questions.length}</Text>
        <TouchableOpacity style={styles.pauseBtnSmall} onPress={() => setPaused(true)}>
          <Text style={styles.pauseText}>⏸</Text>
        </TouchableOpacity>
        <Text style={[styles.timer, timeLeft <= 7 && styles.timerDanger]}>{timeLeft}s</Text>
        <Text style={styles.livesText}>{'❤️'.repeat(lives)}</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressFill, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
      </View>

      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{questions[currentIndex]?.question}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {questions[currentIndex]?.options.map((option) => {
          let bStyle = styles.option;
          if (selectedOption === option) {
            bStyle = feedback === 'correct' ? [styles.option, styles.optionCorrect] : [styles.option, styles.optionWrong];
          }
          if (selectedOption && option === questions[currentIndex].correct) {
            bStyle = [styles.option, styles.optionCorrect];
          }

          return (
            <Animated.View key={option} style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                style={bStyle}
                onPress={() => handleAnswer(option)}
                disabled={!!selectedOption || paused}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {paused && (
        <View style={styles.pauseOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Paused</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setPaused(false)}>
              <Text style={styles.modalBtnText}>RESUME</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: '#6366F1' }]}
              onPress={restart}
            >
              <Text style={styles.modalBtnText}>RESTART</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ── SUB COMPONENTS ────────────────────────────────────────────────
function GameOverScreen({ reason, score, total, timeTaken, onRestart, levelUp, params }) {
  const isWinner = reason === 'completed' && score >= (total * 0.6);
  const [best, setBest] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(`bestTime_\( {params.name}_ \){params.difficulty}_${params.level}`)
      .then(value => setBest(value));
  }, []);

  return (
    <SafeAreaView style={[styles.container, styles.center]}>
      <Text style={styles.gameOverTitle}>{isWinner ? "Level Clear!" : "Game Over"}</Text>
      <Text style={styles.finalScore}>{score} / {total}</Text>
      <Text style={styles.statText}>
        Time: {timeTaken}s {best && `(Best: ${best}s)`}
      </Text>
      {isWinner && (
        <TouchableOpacity
          style={[styles.restartBtn, { backgroundColor: '#10B981', marginBottom: 15 }]}
          onPress={levelUp}
        >
          <Text style={styles.restartBtnText}>Next Level</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.restartBtn} onPress={onRestart}>
        <Text style={styles.restartBtnText}>Play Again</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function LoadingScreen() {
  return (
    <View style={[styles.container, styles.center]}>
      <ActivityIndicator size="large" color="#6366F1" />
    </View>
  );
}

function ErrorScreen({ message }) {
  return (
    <View style={[styles.container, styles.center]}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

