import { useState, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';

export const useQuizLogic = (questions, totalTime, onGameOver) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [paused, setPaused] = useState(false);
  
  const timerRef = useRef(null);

  useEffect(() => {
    if (paused || !questions.length) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          onGameOver('time_up');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [paused, questions, currentIndex]);

  const handleAnswer = (selected) => {
    if (selectedOption || paused) return;
    
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
      const nextLives = isCorrect ? lives : lives - 1;
      if (!isCorrect) setLives(nextLives);

      if (nextLives <= 0) {
        onGameOver('no_lives');
      } else if (currentIndex + 1 >= questions.length) {
        onGameOver('completed');
      } else {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setFeedback(null);
      }
    }, 1000);
  };

  const resetLogic = () => {
    setCurrentIndex(0); setScore(0); setLives(3);
    setTimeLeft(totalTime); setSelectedOption(null);
    setFeedback(null); setPaused(false);
  };

  return {
    currentIndex, score, lives, timeLeft, 
    selectedOption, feedback, paused, 
    setPaused, handleAnswer, resetLogic
  };
};
