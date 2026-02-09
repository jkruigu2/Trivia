import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native'; 
import { styles } from '../styles'; 

export const QuizHeader = ({ current, total, timeLeft, lives, paused, onPause }) => {
  const completed = current - 1;
  const progressPercentage = (completed / total) * 100;

  return (
    <View style={[
      styles.headerContainer, 
      paused && styles.headerPaused // Background turns red if paused
    ]}>
      <View style={styles.header}>
        <View style={styles.percentageBadge}>
          <Text style={styles.headerLeft}>{Math.round(progressPercentage)}%</Text>
        </View>
        <TouchableOpacity style={styles.pauseBtnSmall}>
          <Text style={styles.pauseText}>{'❓'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onPause} style={styles.pauseBtnSmall}>
          <Text style={styles.pauseText}>{paused ? '▶️' : '⏸️'}</Text>
        </TouchableOpacity>

        {/* Timer circle: red if time is low OR if paused */}
        <View style={[
          styles.timerCircle,
          (timeLeft < 10 || paused) && styles.timerUrgent
        ]}>
          <Text style={[styles.timer, (timeLeft < 10 || paused) && { color: '#FFF' }]}>
            {timeLeft}
          </Text>
        </View> 
        <Text style={styles.livesText}>
  {'❤️'.repeat(Math.max(0, lives)) }{'💔'.repeat(Math.max(0, 3 - lives))}
</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
      </View>
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


