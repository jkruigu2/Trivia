import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuizHeader, OptionButton } from './components/QuizUI';
import GameOverScreen from './screens/GameOverScreen';
import { styles as globalStyles } from './styles';

const allData = require('./src/data.json');

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function App() {
  const params = useLocalSearchParams();
  const router = useRouter();

  // --- State ---
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [paused, setPaused] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [gameOverReason, setGameOverReason] = useState(null);
  const [gemsEarned, setGemsEarned] = useState(0);
  
  // Achievement States
  const [showUnlockChip, setShowUnlockChip] = useState(false);
  const [unlockedLevel, setUnlockedLevel] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  const { quizData, totalTime } = useMemo(() => {
    const targetDiff = (params.difficulty || 'Easy').toLowerCase();
    const targetCat = params.name || 'Adventure';
    const targetLevel = parseInt(params.level) || 1;

    const filtered = allData.filter(q => 
      (q.difficulty || '').toLowerCase() === targetDiff && 
      q.category === targetCat && 
      q.level === targetLevel
    );

    const randomizedQuestions = filtered.map(q => ({
      ...q,
      options: shuffleArray(q.options || [])
    }));

    const timePerQ = targetDiff === "easy" ? 20 : targetDiff === "medium" ? 15 : 10;
    return { quizData: randomizedQuestions, totalTime: randomizedQuestions.length * timePerQ };
  }, [params.level, params.name, params.difficulty]);

  const [timeLeft, setTimeLeft] = useState(totalTime);

  // --- Achievement Animation Logic ---
  const triggerAchievement = (level) => {
    setUnlockedLevel(level);
    setShowUnlockChip(true);
    
    // Animate In
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 20, friction: 6, useNativeDriver: true })
    ]).start();

    // Animate Out
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -50, duration: 400, useNativeDriver: true })
      ]).start(() => setShowUnlockChip(false));
    }, 3000);
  };

  // --- Timer Logic ---
  useEffect(() => {
    if (paused || gameOverReason || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setGameOverReason('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paused, gameOverReason, timeLeft]);

  const timeUsed = Math.max(0, totalTime - timeLeft);

  // --- Progress & Reward Logic ---
  const saveProgress = async (newScore, isFinal = false) => {
    try {
      const jsonValue = await AsyncStorage.getItem('levelData');
      let data = jsonValue != null ? JSON.parse(jsonValue) : {};
      
      const cat = params.name;
      const diff = params.difficulty;
      const levelIdx = (parseInt(params.level) || 1) - 1;

      if (!data[cat]) data[cat] = {};
      if (!data[cat][diff]) {
        data[cat][diff] = { unlocked: 1, scores: Array(9).fill(0), times: Array(9).fill(null) };
      }

      const stats = data[cat][diff];
      const percentage = Math.round((newScore / quizData.length) * 100);
      
      // Capture previous score to check for first-time completion
      const previousBest = stats.scores[levelIdx];

      // Update score if current attempt is better
      if (percentage > previousBest) {
        stats.scores[levelIdx] = percentage;
        if (isFinal) stats.times[levelIdx] = timeUsed;
      }

      // Logic for unlocking next level
      if (percentage >= 70 && (levelIdx + 1) === stats.unlocked && (levelIdx + 1) < 9) {
        stats.unlocked = levelIdx + 2;
        triggerAchievement(levelIdx + 2);
      }

      await AsyncStorage.setItem('levelData', JSON.stringify(data));

      // --- FIRST TIME REWARD LOGIC ---
      if (isFinal && percentage === 100 && previousBest < 100) {
        const gemValue = await AsyncStorage.getItem('total_gems');
        let currentGems = gemValue != null ? parseInt(gemValue) : 0;
        
        currentGems += 5;
        setGemsEarned(5); 
        await AsyncStorage.setItem('total_gems', currentGems.toString());
      } else if (isFinal) {
        setGemsEarned(0); // Ensure no "ghost rewards" on replay
      }
    } catch (e) { 
      console.error("Progress Error:", e); 
    }
  };

  const handleAnswer = (option) => {
    if (selectedOption || gameOverReason || paused) return;
    setSelectedOption(option);

    const isCorrect = option === quizData[currentIndex].correct;
    const isLast = currentIndex + 1 >= quizData.length;
    const finalScoreForThisStep = isCorrect ? score + 1 : score;

    // Check if we need to save progress (mid-game death or final question)
    if (isCorrect || isLast || lives === 1) {
      saveProgress(finalScoreForThisStep, isLast || (lives === 1 && !isCorrect));
    }

    setTimeout(() => {
      if (isCorrect) {
        setScore(finalScoreForThisStep);
        if (!isLast) {
          setCurrentIndex(prev => prev + 1);
          setSelectedOption(null);
        } else {
          setGameOverReason('completed');
        }
      } else {
        const newLives = lives - 1;
        setLives(newLives);
        if (newLives <= 0) {
          setGameOverReason('lost_lives');
        } else if (isLast) {
          setGameOverReason('completed');
        } else {
          setCurrentIndex(prev => prev + 1);
          setSelectedOption(null);
        }
      }
    }, 600);
  };

  if (gameOverReason) {
    return (
      <GameOverScreen 
        reason={gameOverReason} 
        score={score} 
        total={quizData.length}
        timeUsed={timeUsed} 
        params={params}
        gemsEarned={gemsEarned}
        description={quizData[currentIndex]?.description || "Great effort!"}
        onRestart={() => {
          setCurrentIndex(0); setScore(0); setLives(3); setTimeLeft(totalTime);
          setSelectedOption(null); setGameOverReason(null); setGemsEarned(0); setPaused(false);
        }}
      />
    );
  }

  return (
    <View style={globalStyles.container}>
      <QuizHeader 
        current={currentIndex + 1} 
        total={quizData.length} 
        timeLeft={timeLeft} 
        lives={lives}
        paused={paused}
        onPause={() => setPaused(true)}
      />

      {/* --- ACHIEVEMENT CHIP --- */}
      {showUnlockChip && (
        <Animated.View 
          style={[
            localStyles.chipContainer, 
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={localStyles.chip}>
            <Text style={localStyles.chipEmoji}>🎉</Text>
            <Text style={localStyles.chipText}>Level {unlockedLevel} Unlocked!</Text>
          </View>
        </Animated.View>
      )}

      {/* --- PAUSE MODAL --- */}
      <Modal visible={paused} transparent animationType="fade">
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            <Text style={localStyles.modalTitle}>Game Paused</Text>
            <TouchableOpacity 
              style={localStyles.resumeButton} 
              onPress={() => setPaused(false)}
            >
              <Text style={localStyles.buttonText}>RESUME</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[localStyles.resumeButton, { marginTop: 10, backgroundColor: '#E53935' }]} 
              onPress={() => router.back()}
            >
              <Text style={localStyles.buttonText}>QUIT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={globalStyles.questionCard}>
          <Text style={globalStyles.questionText}>{quizData[currentIndex]?.question}</Text>
        </View>
        <View style={globalStyles.optionsContainer}>
          {quizData[currentIndex]?.options.map((opt) => (
            <OptionButton 
              key={opt} 
              option={opt}
              isSelected={selectedOption === opt}
              isCorrect={opt === quizData[currentIndex].correct}
              isDisabled={!!selectedOption}
              onSelect={() => handleAnswer(opt)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const localStyles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#1E1E1E', borderRadius: 20, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  modalTitle: { fontSize: 24, color: '#FFF', fontWeight: 'bold', marginBottom: 25 },
  resumeButton: { backgroundColor: '#4CAF50', width: '100%', padding: 15, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  chipContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  chip: {
    flexDirection: 'row',
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    alignItems: 'center',
  },
  chipEmoji: { fontSize: 22, marginRight: 10 },
  chipText: { color: '#000', fontWeight: '900', fontSize: 16, textTransform: 'uppercase' },
});
