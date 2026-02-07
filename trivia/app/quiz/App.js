import React, { useState, useMemo } from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuizLogic } from './components/QuizLogic';
import { QuizHeader, OptionButton } from './components/QuizUI';
import GameOverScreen from './screens/GameOverScreen';
import { styles } from './styles';

const allData = require('./src/data.json');

// Helper to shuffle options without mutating original data
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

  // Memoized data filtering AND randomization
  const { quizData, maxLevelAvailable, totalTime } = useMemo(() => {
    // 1. Filter data based on category and level
    const filtered = allData.filter(q => 
      q.difficulty === params.difficulty && 
      q.category === params.name && 
      q.level === parseInt(params.level)
    );

    // 2. Randomize options for each question
    const randomizedQuestions = filtered.map(question => ({
      ...question,
      options: shuffleArray(question.options)
    }));

    // 3. Calculate metadata
    const max = Math.max(...allData.filter(q => q.category === params.name).map(q => q.level), 1);
    const timePerQ = params.difficulty === "easy" ? 20 : params.difficulty === "medium" ? 15 : 10;
    const time = randomizedQuestions.length * timePerQ;

    return { quizData: randomizedQuestions, maxLevelAvailable: max, totalTime: time };
  }, [params.level, params.name, params.difficulty]);

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
        maxLevel={maxLevelAvailable} 
        onRestart={() => { setGameOverReason(null); resetLogic(); }}
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
            key={`${currentIndex}-${opt}`} // Combined key to force refresh on new question
            option={opt}
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
