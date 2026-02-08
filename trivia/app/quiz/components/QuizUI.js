import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles';

export const QuizHeader = ({ current, total, timeLeft, lives, paused, onPause }) => {
  // Calculate percentage based on completed questions
  // Subtracting 1 from current ensures the first question shows 0%
  const completed = current - 1;
  const progressPercentage = Math.round((completed / total) * 100);

  return (
    <View style={styles.header}>
      {/* Shows 0% for the first question */}
      <Text style={styles.headerLeft}>{progressPercentage}%</Text>
      
      <TouchableOpacity onPress={onPause}>
        <Text style={styles.pauseText}>{paused ? '▶️' : '⏯️'}</Text>
      </TouchableOpacity>

      <Text 
        style={[
          styles.timer, 
          (timeLeft < 10 || paused) && { color: 'red' }
        ]}
      >
        {timeLeft}s
      </Text>

      <Text style={styles.livesText}>{'❤️'.repeat(lives)}</Text>
    </View>
  );
};

export const OptionButton = ({ option, isCorrect, isSelected, isDisabled, onSelect }) => {
  const getFeedbackStyle = () => {
    if (isSelected && isCorrect) return styles.optionCorrect;
    if (isSelected && !isCorrect) return styles.optionWrong;
    if (isDisabled && isCorrect) return styles.optionCorrect; 
    return null;
  };

  return (
    <TouchableOpacity 
      style={[styles.option, getFeedbackStyle()]} 
      onPress={() => onSelect(option)}
      disabled={isDisabled}
    >
      <Text style={[styles.optionText, option.length > 25 && { fontSize: 14 }]}>
        {option}
      </Text>
    </TouchableOpacity>
  );
};
