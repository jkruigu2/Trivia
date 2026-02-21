import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Modal, TouchableOpacity } from 'react-native';
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

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [paused, setPaused] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [gameOverReason, setGameOverReason] = useState(null);
  const [gemsEarned, setGemsEarned] = useState(0);

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

  // Timer logic - halts if paused is true
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

      if (percentage > stats.scores[levelIdx]) {
        stats.scores[levelIdx] = percentage;
        if (isFinal) stats.times[levelIdx] = timeUsed;
      }

      if (percentage >= 70 && (levelIdx + 1) === stats.unlocked && (levelIdx + 1) < 9) {
        stats.unlocked = levelIdx + 2;
      }

      await AsyncStorage.setItem('levelData', JSON.stringify(data));

      if (isFinal && percentage === 100) {
        const gemValue = await AsyncStorage.getItem('total_gems');
        let currentGems = gemValue != null ? parseInt(gemValue) : 0;
        currentGems += 5;
        setGemsEarned(5);
        await AsyncStorage.setItem('total_gems', currentGems.toString());
      }
    } catch (e) { console.error(e); }
  };

  const handleAnswer = (option) => {
    if (selectedOption || gameOverReason || paused) return;
    setSelectedOption(option);

    const isCorrect = option === quizData[currentIndex].correct;
    const isLast = currentIndex + 1 >= quizData.length;
    const finalScoreForThisStep = isCorrect ? score + 1 : score;

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
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});
