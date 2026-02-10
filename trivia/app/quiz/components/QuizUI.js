import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from '../styles'; 

export const QuizHeader = ({ 
  current, 
  total, 
  timeLeft, 
  lives, 
  paused, 
  onPause, 
  description 
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [hasPurchasedHint, setHasPurchasedHint] = useState(false);
  const [userGems, setUserGems] = useState(0);

  const completed = current - 1;
  const progressPercentage = (completed / total) * 100;

  // Reset hint purchase status when the question changes
  useEffect(() => {
    setHasPurchasedHint(false);
  }, [current]);

  const handleHintPress = async () => {
    try {
      const storedGems = await AsyncStorage.getItem('total_gems');
      const currentGems = storedGems ? parseInt(storedGems) : 0;
      setUserGems(currentGems);

      // If already bought for THIS question, just show it
      if (hasPurchasedHint) {
        setModalVisible(true);
        return;
      }

      // If user has enough gems, ask to redeem
      if (currentGems >= 2) {
        Alert.alert(
          "Unlock Hint",
          `Redeem 2 gems for a hint? (Balance: ${currentGems})`,
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Redeem", 
              onPress: () => processGemDeduction(currentGems) 
            }
          ]
        );
      } else {
        // Not enough gems logic
        setModalVisible(true);
      }
    } catch (error) {
      console.error("Error accessing gems:", error);
    }
  };

  const processGemDeduction = async (currentGems) => {
    try {
      const newBalance = currentGems - 2;
      await AsyncStorage.setItem('total_gems', newBalance.toString());
      setUserGems(newBalance);
      setHasPurchasedHint(true);
      setModalVisible(true);
    } catch (error) {
      Alert.alert("Error", "Transaction failed. Try again.");
    }
  };

  return (
    <View style={[styles.headerContainer, paused && styles.headerPaused]}>
      
      {/* --- Hint / Error Modal --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={localStyles.modalOverlay}>
          <View style={localStyles.modalContent}>
            <Text style={localStyles.modalTitle}>
              {hasPurchasedHint ? "💡 Hint" : "Gems Required"}
            </Text>
            
            <ScrollView style={localStyles.scrollArea}>
              <Text style={localStyles.modalText}>
                {hasPurchasedHint 
                  ? (description || "No description available for this level.")
                  : "Sorry! You don't have enough gems to get a hint. Watch an ad or buy more gems!"}
              </Text>
            </ScrollView>

            <TouchableOpacity 
              style={[localStyles.closeButton, !hasPurchasedHint && { backgroundColor: '#FF5252' }]} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={localStyles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- Main Header UI --- */}
      <View style={styles.header}>
        <View style={styles.percentageBadge}>
          <Text style={styles.headerLeft}>{Math.round(progressPercentage)}%</Text>
        </View>

        <TouchableOpacity style={styles.pauseBtnSmall} onPress={handleHintPress}>
          <Text style={styles.pauseText}>{'❓'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={onPause} style={styles.pauseBtnSmall}>
          <Text style={styles.pauseText}>{paused ? '▶️' : '⏸️'}</Text>
        </TouchableOpacity>

        <View style={[styles.timerCircle, (timeLeft < 10 || paused) && styles.timerUrgent]}>
          <Text style={[styles.timer, (timeLeft < 10 || paused) && { color: '#FFF' }]}>
            {timeLeft}
          </Text>
        </View> 

        <Text style={styles.livesText}>
          {'❤️'.repeat(Math.max(0, lives))}{'💔'.repeat(Math.max(0, 3 - lives))}
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

const localStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333'
  },
  scrollArea: {
    maxHeight: 150,
    marginBottom: 20
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 22
  },
  closeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  }
});
