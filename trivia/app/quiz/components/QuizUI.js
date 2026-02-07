import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles';

export const QuizHeader = ({ current, total, timeLeft, lives, onPause }) => (
  <View style={styles.header}>
    <Text style={styles.headerLeft}>{current}/{total}</Text>
    <TouchableOpacity onPress={onPause}>
      <Text style={styles.pauseText}>⏸</Text>
    </TouchableOpacity>
    <Text style={[styles.timer, timeLeft < 10 && { color: 'red' }]}>{timeLeft}s</Text>
    <Text style={styles.livesText}>{'❤️'.repeat(lives)}</Text>
  </View>
);

export const OptionButton = ({ option, isCorrect, isSelected, isDisabled, onSelect }) => {
  const getFeedbackStyle = () => {
    if (isSelected && isCorrect) return styles.optionCorrect;
    if (isSelected && !isCorrect) return styles.optionWrong;
    if (isDisabled && isCorrect) return styles.optionCorrect; // Show right answer on fail
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
