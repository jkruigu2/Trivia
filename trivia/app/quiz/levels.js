import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  ScrollView,
  SafeAreaView,
  Platform,
  Alert,
  Animated,
  Easing,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// --- ADMOB DISABLED VIA COMMENTS ---
/*
let useRewardedAd = () => ({ isLoaded: false, show: () => {}, load: () => {}, isEarnedReward: false });
let TestIds = { REWARDED: '' };
let mobileAds = null;

try {
  const AdLib = require('react-native-google-mobile-ads');
  useRewardedAd = AdLib.useRewardedAd;
  TestIds = AdLib.TestIds;
  mobileAds = AdLib.default;
} catch (e) {
  console.log("AdMob not detected.");
}
*/

// AdMob Stubs to prevent reference errors
const mobileAds = null; 
const useRewardedAd = () => ({ isLoaded: false, show: () => {}, load: () => {}, isEarnedReward: false });

const { width } = Dimensions.get('window');
const AnimatedPath = Animated.createAnimatedComponent(Path);

const MAP_HEIGHT = 1500;
const LEVEL_COUNT = 9;
const UNLOCK_COST = 3;
const PADDING_TOP = 200;
const PADDING_BOTTOM = 200;

// const adUnitId = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-6324435412261125/YOUR_REWARD_ID';

const levels = Array.from({ length: LEVEL_COUNT }, (_, i) => {
  let xPos = width * 0.5;
  if (i % 4 === 1) xPos = width * 0.22;
  if (i % 4 === 3) xPos = width * 0.78;
  return {
    id: i + 1,
    x: xPos,
    y: PADDING_TOP + i * ((MAP_HEIGHT - PADDING_TOP - PADDING_BOTTOM) / (LEVEL_COUNT - 1)),
    grad: i < 3 ? 'candyPink' : i < 6 ? 'candyBlue' : 'candyYellow',
  };
});

export default function LevelMap() {
  const [progress, setProgress] = useState({ unlocked: 1, scores: Array(9).fill(0) });
  const [totalGems, setTotalGems] = useState(0);
  const [pressedId, setPressedId] = useState(null);
  const scrollRef = useRef(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const { name = 'Adventure', difficulty = 'Easy' } = params;

  const scrollY = useRef(new Animated.Value(0)).current;
  const dashOffset = useRef(new Animated.Value(0)).current;

  // --- ADMOB HOOK DISABLED ---
  /*
  const ad = useRewardedAd(adUnitId, {
    requestNonPersonalizedAdsOnly: true,
  });

  useEffect(() => {
    if (ad.isEarnedReward) {
      addGems(5);
    }
  }, [ad.isEarnedReward]);
  */

  const addGems = async (amount) => {
    const newGems = totalGems + amount;
    await AsyncStorage.setItem('total_gems', newGems.toString());
    setTotalGems(newGems);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Success", `You received ${amount} gems.`);
    // if (mobileAds) ad.load();
  };

  const handleWatchAd = () => {
    // Logic defaults to Mock Mode since AdMob is commented out
    if (mobileAds /* && ad.isLoaded */) {
       // ad.show()
    } else {
      Alert.alert(
        "Ads Disabled", 
        "Running in Development/Expo Go. Get mock reward?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Mock Reward (+5)", onPress: () => addGems(5) }
        ]
      );
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadProgress();
      /*
      if (mobileAds) {
        mobileAds().initialize();
        ad.load();
      }
      */
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

  const backgroundColor = scrollY.interpolate({
    inputRange: [0, MAP_HEIGHT * 0.3, MAP_HEIGHT * 0.6, MAP_HEIGHT],
    outputRange: ['#4facfe', '#00f2fe', '#f093fb', '#243949'],
  });

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

  const handleUnlockLevel = (levelId) => {
    if (levelId !== progress.unlocked + 1) return;
    if (totalGems < UNLOCK_COST) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Locked", `You need ${UNLOCK_COST} gems.`, [
        { text: "Ok" },
        { text: "Earn Gems", onPress: handleWatchAd }
      ]);
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
          <Path d={d} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth={14} strokeLinecap="round" />
          <AnimatedPath
            d={d}
            fill="none"
            stroke={isUnlocked ? 'white' : 'rgba(255,255,255,0.2)'}
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
            <LinearGradient id="candyPink" x1="0" y1="0" x2="0" y2="1"><Stop offset="0%" stopColor="#ff9a9e" /><Stop offset="100%" stopColor="#fecfef" /></LinearGradient>
            <LinearGradient id="candyBlue" x1="0" y1="0" x2="0" y2="1"><Stop offset="0%" stopColor="#a1c4fd" /><Stop offset="100%" stopColor="#c2e9fb" /></LinearGradient>
            <LinearGradient id="candyYellow" x1="0" y1="0" x2="0" y2="1"><Stop offset="0%" stopColor="#f6d365" /><Stop offset="100%" stopColor="#fda085" /></LinearGradient>
            <LinearGradient id="unlockedGrad" x1="0" y1="0" x2="0" y2="1"><Stop offset="0%" stopColor="#FFF200" /><Stop offset="100%" stopColor="#FF9000" /></LinearGradient>
          </Defs>
          {renderPathSegments()}
          {levels.map((level) => {
            const isLocked = level.id > progress.unlocked;
            const isNext = level.id === progress.unlocked + 1;
            const isCurrent = level.id === progress.unlocked;
            const isPressed = pressedId === level.id;
            return (
              <G key={level.id}
                onPressIn={() => { setPressedId(level.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                onPressOut={() => setPressedId(null)}
                onPress={() => !isLocked ? router.push({ pathname: '/quiz/App', params: { ...params, level: level.id } }) : isNext ? handleUnlockLevel(level.id) : null}
              >
                <Circle cx={level.x} cy={level.y} r={50} fill="transparent" />
                <G transform={isPressed ? `translate(${level.x}, ${level.y}) scale(0.9) translate(${-level.x}, ${-level.y})` : ''}>
                  {isCurrent && <Circle cx={level.x} cy={level.y} r={44} fill="white" opacity="0.3" />}
                  <Circle cx={level.x} cy={level.y} r={30} fill={isLocked ? (isNext ? '#cbd5e0' : '#718096') : isCurrent ? 'url(#unlockedGrad)' : `url(#${level.grad})`} stroke="white" strokeWidth={isCurrent ? 6 : 4} />
                  <SvgText x={level.x} y={level.y + 8} fill={isLocked ? '#edf2f7' : '#2d3748'} fontSize="20" fontWeight="bold" textAnchor="middle">
                    {isLocked ? (isNext ? '💎' : '🔒') : level.id}
                  </SvgText>
                </G>
              </G>
            );
          })}
        </Svg>
      </Animated.ScrollView>

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
              <Ionicons name="diamond" size={18} color="#00E5FF" />
            </View>
            <TouchableOpacity onPress={handleWatchAd} style={styles.plusButton}>
              <Ionicons name="add-circle" size={28} color="#00BCD4" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: { position: 'absolute', top: Platform.OS === 'ios' ? 0 : 30, left: 0, right: 0, paddingHorizontal: 16, zIndex: 100 },
  glassHeader: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    backgroundColor: 'rgba(255, 255, 255, 0.95)', paddingVertical: 10, paddingHorizontal: 18, 
    borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 6 
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  categoryText: { fontSize: 13, fontWeight: '900', color: '#1a202c' },
  headerDivider: { width: 1.5, height: 16, backgroundColor: '#cbd5e0', marginHorizontal: 12 },
  difficultyText: { fontSize: 12, color: '#718096', fontWeight: 'bold' },
  gemBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 229, 255, 0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  gemText: { color: '#00BCD4', fontSize: 16, fontWeight: 'bold', marginRight: 4 },
  plusButton: { marginLeft: 8 },
});
