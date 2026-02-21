import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Alert, 
  Modal, 
  TouchableOpacity, 
  StyleSheet 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuizLogic } from './components/QuizLogic';
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

      if (percentage === 100) {
        Alert.alert("Perfect Score! 🌟", "Unstoppable! You got every single question right.");
      }

      if (percentage === 100 && previousBest < 100) {
        let x = currentTotalGems + 5;
        setGemsEarned(5);
        await AsyncStorage.setItem('total_gems', x.toString());
      }

      if (percentage >= 70) {
        if (currentLevel === currentProgress.unlocked && currentLevel < 9) {
          currentProgress.unlocked = currentLevel + 1;
        }
      }

      if (percentage > previousBest) {
        currentProgress.scores[levelIdx] = percentage;
      }

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
    <View style={globalStyles.container}>
      <QuizHeader 
        current={currentIndex + 1} 
        total={quizData.length} 
        timeLeft={timeLeft} 
        lives={lives}
        paused={paused}
        onPause={() => setPaused(true)}
        description={quizData[currentIndex]?.description}
      />

      {/* --- PAUSE MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={paused}
        onRequestClose={() => setPaused(false)}
      >
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            <Text style={localStyles.modalTitle}>Game Paused</Text>
            <Text style={localStyles.modalSubtitle}>Current Score: {score}</Text>
            
            <TouchableOpacity 
              style={localStyles.resumeButton} 
              onPress={() => setPaused(false)}
            >
              <Text style={localStyles.buttonText}>Resume</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={localStyles.restartButton} 
              onPress={() => {
                setPaused(false);
                resetLogic();
              }}
            >
              <Text style={localStyles.buttonText}>Restart Level</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={localStyles.exitButton} 
              onPress={() => {
                setPaused(false);
                router.back();
              }}
            >
              <Text style={localStyles.exitText}>Quit Quiz</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView>
        <View style={globalStyles.questionCard}>
          <Text style={globalStyles.questionText}>
            {quizData[currentIndex]?.question || "No Question Found"}
          </Text>
        </View>

        <View style={globalStyles.optionsContainer}>
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

// Local styles for the Modal
const localStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#1E1E1E',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#BBB',
    marginBottom: 25,
  },
  resumeButton: {
    backgroundColor: '#4CAF50',
    width: '100%',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  restartButton: {
    backgroundColor: '#2196F3',
    width: '100%',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  exitButton: {
    marginTop: 10,
    padding: 10,
  },
  exitText: {
    color: '#FF5252',
    fontSize: 16,
    fontWeight: '500',
  }
});