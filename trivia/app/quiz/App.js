import React, { useState, useEffect, useMemo } from 'react';
import { View, Text,ScrollView, Alert } from 'react-native'; // Added Alert
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuizLogic } from './components/QuizLogic';
import { QuizHeader, OptionButton } from './components/QuizUI';
import GameOverScreen from './screens/GameOverScreen';
import { styles } from './styles';

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
  const [gameOverReason, setGameOverReason] = useState(null);
  const [gemsEarned, setGemsEarned] = useState(0);

  // Memoized Filtering with Crash Protection
  const { quizData, totalTime } = useMemo(() => {
    const targetDiff = (params.difficulty || '').toLowerCase();
    const targetCat = params.name;
    const targetLevel = parseInt(params.level);

    const filtered = allData.filter(q => 
      (q.difficulty || '').toLowerCase() === targetDiff && 
      q.category === targetCat && 
      q.level === targetLevel
    );

    const randomizedQuestions = filtered.map(question => ({
      ...question,
      options: shuffleArray(question.options)
    }));

    const timePerQ = targetDiff === "easy" ? 20 : targetDiff === "medium" ? 15 : 10;
    const time = randomizedQuestions.length * timePerQ;

    return { quizData: randomizedQuestions, totalTime: time };
  }, [params.level, params.name, params.difficulty]);

  const {
    currentIndex, score, lives, timeLeft, 
    selectedOption, paused, 
    setPaused, handleAnswer, resetLogic
  } = useQuizLogic(quizData, totalTime, setGameOverReason);

  // Trigger save logic when game completes
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
      const currentLevel = parseInt(params.level);
      const levelIdx = currentLevel - 1;

      if (!data[cat]) data[cat] = {};
      if (!data[cat][diff]) {
        data[cat][diff] = { unlocked: 1, scores: Array(9).fill(0) };
      }

      const currentProgress = data[cat][diff];
      const totalQuestions = quizData.length || 1;
      const percentage = Math.round((score / totalQuestions) * 100);
      const previousBest = currentProgress.scores[levelIdx] || 0;

      // --- ALERT LOGIC ---
      if (percentage === 100) {
        Alert.alert(
          "Perfect Score! 🌟",
          "Unstoppable! You got every single question right.",
          [{ text: "Continue" }]
        );
      }

      // 1. AWARD GEMS: Only if the user reaches 100% for the first time
      if (percentage === 100 && previousBest < 100) {
       let x = currentTotalGems + 5;
        setGemsEarned(x);
        await AsyncStorage.setItem('total_gems', x.toString());
      }

      // 2. UNLOCK NEXT LEVEL
      if (percentage >= 70) {
        if (currentLevel === currentProgress.unlocked && currentLevel < 9) {
          currentProgress.unlocked = currentLevel + 1;
        }
      }

      // 3. UPDATE HIGH SCORE
      if (percentage > previousBest) {
        currentProgress.scores[levelIdx] = percentage;
      }

      // 4. PERSIST ALL DATA
      data[cat][diff] = currentProgress;
      await AsyncStorage.setItem('levelData', JSON.stringify(data));

    } catch (e) {
      console.error("Save Progress Error:", e);
    }
  };

  if (gameOverReason) {
    return (
      <GameOverScreen 
        reason={gameOverReason} 
        score={score} 
        total={quizData.length}
        timeLeft={timeLeft} 
        params={params}
        gemsEarned={gemsEarned}
        onRestart={() => { 
          setGameOverReason(null); 
          setGemsEarned(0);
          resetLogic(); 
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <QuizHeader 
        current={currentIndex + 1} 
        total={quizData.length} 
        timeLeft={timeLeft} 
        lives={lives}
        paused={paused}
        onPause={() => setPaused(!paused)}
        description={quizData[currentIndex].description}
      />
      <ScrollView>
      <View style={styles.questionCard}>
        <Text style={styles.questionText}>
          {quizData[currentIndex]?.question || "No Question Found"}
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        {quizData[currentIndex]?.options.map((opt) => (
          <OptionButton 
            key={`${currentIndex}-${opt}`} 
            option={opt}
            isSelected={selectedOption === opt}
            isCorrect={opt === quizData[currentIndex].correct}
            isDisabled={!!selectedOption}
            onSelect={handleAnswer}
          />
        ))}
      </View>
      </ScrollView>
    </View>
  );
}
