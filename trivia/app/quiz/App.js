import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuizHeader, OptionButton } from './components/QuizUI';
import GameOverScreen from './screens/GameOverScreen';
import { styles as globalStyles } from './styles';

const allData = require('./src/data.json');

// Helper to shuffle options
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

  // --- Game State ---
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [paused, setPaused] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [gameOverReason, setGameOverReason] = useState(null);
  const [gemsEarned, setGemsEarned] = useState(0);

  // --- Quiz Data Initialization ---
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
    return { 
      quizData: randomizedQuestions, 
      totalTime: randomizedQuestions.length * timePerQ 
    };
  }, [params.level, params.name, params.difficulty]);

  const [timeLeft, setTimeLeft] = useState(totalTime);

  // --- The Timer Logic ---
  useEffect(() => {
    // STOP TIMER: If paused OR if a game over reason exists, do not run interval
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

    // Cleanup on unmount or state change
    return () => clearInterval(timer);
  }, [paused, gameOverReason, timeLeft]);

  // Calculate fixed time used for DB/UI
  const timeUsed = Math.max(0, totalTime - timeLeft);

  // --- Game Mechanics ---
  const handleAnswer = (option) => {
    if (selectedOption || gameOverReason) return;
    setSelectedOption(option);

    const isCorrect = option === quizData[currentIndex].correct;
    
    setTimeout(() => {
      if (isCorrect) {
        setScore(prev => prev + 1);
        if (currentIndex + 1 < quizData.length) {
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
        } else {
          // If they got it wrong but have lives, move to next anyway (standard quiz style)
          if (currentIndex + 1 < quizData.length) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
          } else {
            setGameOverReason('completed');
          }
        }
      }
    }, 600);
  };

  const resetGame = () => {
    setCurrentIndex(0);
    setScore(0);
    setLives(3);
    setTimeLeft(totalTime);
    setSelectedOption(null);
    setGameOverReason(null);
    setGemsEarned(0);
    setPaused(false);
  };

  // --- Persistence Logic ---
  useEffect(() => {
    if (gameOverReason === 'completed') {
      processLevelCompletion();
    }
  }, [gameOverReason]);

  const processLevelCompletion = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('levelData');
      const gemValue = await AsyncStorage.getItem('total_gems');
      let data = jsonValue != null ? JSON.parse(jsonValue) : {};
      let currentTotalGems = gemValue != null ? parseInt(gemValue) : 0;

      const cat = params.name;
      const diff = params.difficulty;
      const levelIdx = (parseInt(params.level) || 1) - 1;

      if (!data[cat]) data[cat] = {};
      if (!data[cat][diff]) {
        data[cat][diff] = { unlocked: 1, scores: Array(9).fill(0), times: Array(9).fill(null) };
      }

      const stats = data[cat][diff];
      const percentage = Math.round((score / quizData.length) * 100);

      if (percentage === 100 && stats.scores[levelIdx] < 100) {
        currentTotalGems += 5;
        setGemsEarned(5);
        await AsyncStorage.setItem('total_gems', currentTotalGems.toString());
      }

      if (percentage >= 70 && (levelIdx + 1) === stats.unlocked && (levelIdx + 1) < 9) {
        stats.unlocked = levelIdx + 2;
      }

      if (percentage > stats.scores[levelIdx] || (percentage === stats.scores[levelIdx] && (stats.times[levelIdx] === null || timeUsed < stats.times[levelIdx]))) {
        stats.scores[levelIdx] = percentage;
        stats.times[levelIdx] = timeUsed;
      }

      await AsyncStorage.setItem('levelData', JSON.stringify(data));
    } catch (e) { console.error("Save Error:", e); }
  };

  // --- Rendering ---
  if (gameOverReason) {
    return (
      <GameOverScreen 
        reason={gameOverReason} 
        score={score} 
        total={quizData.length}
        timeUsed={timeUsed} 
        params={params}
        gemsEarned={gemsEarned}
        onRestart={resetGame}
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
      
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={globalStyles.questionCard}>
          <Text style={globalStyles.questionText}>
            {quizData[currentIndex]?.question}
          </Text>
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
