import React, { useState, useMemo } from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuizLogic } from './components/QuizLogic';
import { QuizHeader, OptionButton } from './components/QuizUI';
import GameOverScreen from './screens/GameOverScreen';
import { styles } from './styles';

const allData = require('./src/data.json');

export default function App() {
  const params = useLocalSearchParams();
  const [gameOverReason, setGameOverReason] = useState(null);

  // Memoized data filtering
  const { quizData, maxLevelAvailable, totalTime } = useMemo(() => {
    const filtered = allData.filter(q => 
      q.difficulty === params.difficulty && q.category === params.name && q.level === parseInt(params.level)
    );
    const max = Math.max(...allData.filter(q => q.category === params.name).map(q => q.level), 1);
    const time = filtered.length * (params.difficulty === "easy" ? 20 : 10);
    return { quizData: filtered, maxLevelAvailable: max, totalTime: time };
  }, [params]);

  const {
    currentIndex, score, lives, timeLeft, 
    selectedOption, feedback, paused, 
    setPaused, handleAnswer, resetLogic
  } = useQuizLogic(quizData, totalTime, setGameOverReason);

  if (gameOverReason) {
    return (
      <GameOverScreen 
        reason={gameOverReason} score={score} total={quizData.length}
        timeLeft={timeLeft} totalTime={totalTime} params={params}
        maxLevel={maxLevelAvailable} onRestart={() => { setGameOverReason(null); resetLogic(); }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <QuizHeader 
        current={currentIndex + 1} total={quizData.length} 
        timeLeft={timeLeft} lives={lives} onPause={() => setPaused(!paused)} 
      />
      
      <View style={styles.questionCard}>
        <Text style={styles.questionText}>{quizData[currentIndex]?.question}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {quizData[currentIndex]?.options.map((opt) => (
          <OptionButton 
            key={opt} option={opt}
            isSelected={selectedOption === opt}
            isCorrect={opt === quizData[currentIndex].correct}
            isDisabled={!!selectedOption}
            onSelect={handleAnswer}
          />
        ))}
      </View>
    </View>
  );
}
