import React, { useEffect, useState, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  SafeAreaView,
  Platform,
  Alert,
  Animated,
  Easing,
  TouchableOpacity,
  Modal,
} from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const AnimatedPath = Animated.createAnimatedComponent(Path);

const MAP_HEIGHT = 1500;
const LEVEL_COUNT = 9;
const UNLOCK_COST = 3;
const PADDING_TOP = 200;
const PADDING_BOTTOM = 200;

const levels = Array.from({ length: LEVEL_COUNT }, (_, i) => {
  let xPos = width * 0.5;
  if (i % 4 === 1) xPos = width * 0.22;
  if (i % 4 === 3) xPos = width * 0.78;
  return {
    id: i + 1,
    x: xPos,
    y: PADDING_TOP + i * ((MAP_HEIGHT - PADDING_TOP - PADDING_BOTTOM) / (LEVEL_COUNT - 1)),
    grad: i < 3 ? 'candyPink' : i < 6 ? 'candyPurple' : 'candyDeepPink',
  };
});

export default function LevelMap() {
  const [progress, setProgress] = useState({ unlocked: 1, scores: Array(9).fill(0) });
  const [totalGems, setTotalGems] = useState(0);
  const [pressedId, setPressedId] = useState(null);
  const [infoLevel, setInfoLevel] = useState(null); // Tracks modal visibility
  
  const scrollRef = useRef(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const { name = 'Adventure', difficulty = 'Easy' } = params;

  const scrollY = useRef(new Animated.Value(0)).current;
  const dashOffset = useRef(new Animated.Value(0)).current;

  // Load progress and gems
  const loadProgress = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('levelData');
      let data = jsonValue != null ? JSON.parse(jsonValue) : {};
      const categoryData = data[name]?.[difficulty] || { unlocked: 1, scores: Array(9).fill(0) };
      const gemValue = await AsyncStorage.getItem('total_gems');
      
      setTotalGems(gemValue != null ? parseInt(gemValue, 10) : 0);
      setProgress({
        unlocked: parseInt(categoryData.unlocked) || 1,
        scores: (categoryData.scores || Array(9).fill(0)).map((s) => parseInt(s, 10)),
      });
    } catch (e) { console.error(e); }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadProgress();
    }, [])
  );

  useEffect(() => {
    Animated.loop(
      Animated.timing(dashOffset, {
        toValue: 40,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const addGems = async (amount) => {
    const newGems = totalGems + amount;
    await AsyncStorage.setItem('total_gems', newGems.toString());
    setTotalGems(newGems);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleWatchAd = () => {
    Alert.alert("Ads Disabled", "Development Mode. Mock reward?", [
      { text: "Cancel", style: "cancel" },
      { text: "Mock Reward (+5)", onPress: () => addGems(5) }
    ]);
  };

  const handleUnlockLevel = (levelId) => {
    if (levelId !== progress.unlocked + 1) return;
    if (totalGems < UNLOCK_COST) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Locked", `Need ${UNLOCK_COST} gems.`, [{ text: "Ok" }, { text: "Earn", onPress: handleWatchAd }]);
      return;
    }
    Alert.alert("Unlock?", `Spend ${UNLOCK_COST} gems?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Unlock", onPress: async () => {
          const newGems = totalGems - UNLOCK_COST;
          await AsyncStorage.setItem('total_gems', newGems.toString());
          setTotalGems(newGems);
          setProgress(p => ({ ...p, unlocked: levelId }));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }}
    ]);
  };

  const backgroundColor = scrollY.interpolate({
    inputRange: [0, MAP_HEIGHT * 0.4, MAP_HEIGHT * 0.7, MAP_HEIGHT],
    outputRange: ['#ffafbd', '#ffc3a0', '#9129d6', '#4834d4'],
  });

  const renderPathSegments = () => {
    return levels.map((curr, i) => {
      if (i === levels.length - 1) return null;
      const next = levels[i + 1];
      const dy = next.y - curr.y;
      const dx = next.x - curr.x;
      const d = `M ${curr.x} ${curr.y} C ${curr.x + dx * 0.1} ${curr.y + dy * 0.3}, ${next.x - dx * 0.1} ${curr.y + dy * 0.7}, ${next.x} ${next.y}`;
      const isUnlocked = next.id <= progress.unlocked;
      return (
        <G key={`path-${i}`}>
          <Path d={d} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={14} strokeLinecap="round" />
          <AnimatedPath
            d={d}
            fill="none"
            stroke={isUnlocked ? 'white' : 'rgba(255,255,255,0.3)'}
            strokeWidth={isUnlocked ? 8 : 5}
            strokeDasharray={[15, 20]}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </G>
      );
    });
  };

  return (
    <Animated.View style={[styles.container, { backgroundColor }]}>
      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ height: MAP_HEIGHT }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        <Svg height={MAP_HEIGHT} width={width}>
          <Defs>
            <LinearGradient id="candyPink" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#ff9a9e" /><Stop offset="100%" stopColor="#fecfef" />
            </LinearGradient>
            <LinearGradient id="candyPurple" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#9129d6" /><Stop offset="100%" stopColor="#6c5ce7" />
            </LinearGradient>
            <LinearGradient id="candyDeepPink" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#e84393" /><Stop offset="100%" stopColor="#d63031" />
            </LinearGradient>
            <LinearGradient id="unlockedGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FFF200" /><Stop offset="100%" stopColor="#FF9000" />
            </LinearGradient>
          </Defs>
          
          {renderPathSegments()}

          {levels.map((level) => {
            const isLocked = level.id > progress.unlocked;
            const isNext = level.id === progress.unlocked + 1;
            const isCurrent = level.id === progress.unlocked;
            const isPressed = pressedId === level.id;

            return (
              <G key={level.id}>
                {/* Main Level Button */}
                <G
                  onPressIn={() => { setPressedId(level.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  onPressOut={() => setPressedId(null)}
                  onPress={() => !isLocked ? router.push({ pathname: '/quiz/App', params: { ...params, level: level.id } }) : isNext ? handleUnlockLevel(level.id) : null}
                >
                  <Circle cx={level.x} cy={level.y} r={45} fill="transparent" />
                  <G transform={isPressed ? `translate(${level.x}, ${level.y}) scale(0.9) translate(${-level.x}, ${-level.y})` : ''}>
                    {isCurrent && <Circle cx={level.x} cy={level.y} r={44} fill="white" opacity="0.4" />}
                    <Circle cx={level.x} cy={level.y} r={30} fill={isLocked ? (isNext ? '#dcdde1' : '#7f8c8d') : isCurrent ? 'url(#unlockedGrad)' : `url(#${level.grad})`} stroke="white" strokeWidth={isCurrent ? 6 : 4} />
                    <SvgText x={level.x} y={level.y + 8} fill={isLocked ? '#a4b0be' : '#2d3748'} fontSize="20" fontWeight="bold" textAnchor="middle">
                      {isLocked ? (isNext ? '💎' : '🔒') : level.id}
                    </SvgText>
                  </G>
                </G>

                {/* Info Icon Button (Only for unlocked levels) */}
                {!isLocked && (
                  <G onPress={() => { setInfoLevel(level.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}>
                    <Circle cx={level.x + 28} cy={level.y - 28} r={14} fill="white" stroke="#9129d6" strokeWidth={1.5} />
                    <SvgText x={level.x + 28} y={level.y - 24} fill="#9129d6" fontSize="12" fontWeight="900" textAnchor="middle">i</SvgText>
                  </G>
                )}
              </G>
            );
          })}
        </Svg>
      </Animated.ScrollView>

      {/* Header UI */}
      <SafeAreaView style={styles.headerContainer} pointerEvents="box-none">
        <View style={styles.glassHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.categoryText}>{name.toUpperCase()}</Text>
            <View style={styles.headerDivider} />
            <Text style={styles.difficultyText}>{difficulty}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.gemBadge}>
              <Text style={styles.gemText}>{totalGems}</Text>
              <Ionicons name="diamond" size={18} color="#e84393" />
            </View>
            <TouchableOpacity onPress={handleWatchAd} style={styles.plusButton}>
              <Ionicons name="add-circle" size={28} color="#e84393" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Progress Info Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={infoLevel !== null}
        onRequestClose={() => setInfoLevel(null)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setInfoLevel(null)}>
          <View style={styles.scoreModal}>
            <View style={styles.modalHeaderIcon}>
              <Ionicons name="trophy" size={40} color="#FFD700" />
            </View>
            <Text style={styles.modalTitle}>Level {infoLevel} Progress</Text>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>Highest Score</Text>
              <Text style={styles.scoreValue}>{infoLevel ? progress.scores[infoLevel - 1] : 0}%</Text>
            </View>
            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setInfoLevel(null)}>
              <Text style={styles.closeModalText}>CONTINUE</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { position: 'absolute', top: Platform.OS === 'ios' ? 0 : 30, left: 0, right: 0, paddingHorizontal: 16, zIndex: 100 },
  glassHeader: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    backgroundColor: 'rgba(255, 255, 255, 0.92)', paddingVertical: 10, paddingHorizontal: 18, 
    borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  categoryText: { fontSize: 13, fontWeight: '900', color: '#9129d6' },
  headerDivider: { width: 1.5, height: 16, backgroundColor: '#f1f2f6', marginHorizontal: 12 },
  difficultyText: { fontSize: 12, color: '#9129d6', fontWeight: 'bold' },
  gemBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(232, 67, 147, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  gemText: { color: '#e84393', fontSize: 16, fontWeight: 'bold', marginRight: 4 },
  plusButton: { marginLeft: 8 },
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  scoreModal: { 
    width: width * 0.8, backgroundColor: 'white', borderRadius: 30, 
    padding: 30, alignItems: 'center', elevation: 20, shadowColor: '#000', 
    shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 
  },
  modalHeaderIcon: { 
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff9e6', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 15 
  },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#2d3748', marginBottom: 20 },
  scoreRow: { 
    width: '100%', flexDirection: 'row', justifyContent: 'space-between', 
    alignItems: 'center', paddingVertical: 15, borderTopWidth: 1, borderTopColor: '#f1f2f6' 
  },
  scoreLabel: { fontSize: 16, color: '#7f8c8d', fontWeight: '500' },
  scoreValue: { fontSize: 24, fontWeight: '900', color: '#9129d6' },
  closeModalBtn: { 
    marginTop: 25, backgroundColor: '#9129d6', width: '100%', 
    paddingVertical: 15, borderRadius: 20, alignItems: 'center' 
  },
  closeModalText: { color: 'white', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
});
