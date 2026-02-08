import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions, ScrollView, SafeAreaView, Platform } from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MAP_HEIGHT = SCREEN_HEIGHT * 2.5; 
const BOTTOM_PADDING = 120; 
const TOP_PADDING = 150; 
const LEVEL_COUNT = 9;
const SCROLLABLE_AREA = MAP_HEIGHT - BOTTOM_PADDING - TOP_PADDING;
const DYNAMIC_SPACING = SCROLLABLE_AREA / (LEVEL_COUNT - 1);

const levels = Array.from({ length: LEVEL_COUNT }, (_, i) => {
  let xPos = width * 0.5;
  if (i % 4 === 1) xPos = width * 0.25;
  if (i % 4 === 3) xPos = width * 0.75;

  return {
    id: i + 1,
    x: xPos,
    y: (MAP_HEIGHT - BOTTOM_PADDING) - (i * DYNAMIC_SPACING),
    grad: i % 3 === 0 ? "candyPink" : i % 3 === 1 ? "candyBlue" : "candyYellow"
  };
});

export default function LevelMap() {
  const [progress, setProgress] = useState({ unlocked: 1, scores: Array(9).fill(0) });
  const [totalGems, setTotalGems] = useState(0);
  const scrollRef = useRef(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const { name = 'Category', difficulty = 'Easy' } = params;

  useEffect(() => { 
    loadProgress(); 
  }, [params]);

  // AUTO-FOCUS: Center the scroll on the current unlocked level
  useEffect(() => {
    if (progress.unlocked) {
      const currentLevel = levels.find(l => l.id === progress.unlocked);
      if (currentLevel) {
        const scrollToY = currentLevel.y - (SCREEN_HEIGHT / 2);
        const timer = setTimeout(() => {
          scrollRef.current?.scrollTo({
            y: Math.max(0, scrollToY),
            animated: true
          });
        }, 400); // Slightly longer delay to ensure layout is ready
        return () => clearTimeout(timer);
      }
    }
  }, [progress.unlocked]);

  const loadProgress = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('levelData');
      let data = jsonValue != null ? JSON.parse(jsonValue) : {};
      const categoryData = data[name]?.[difficulty] || { unlocked: 1, scores: Array(9).fill(0) };
      const gemValue = await AsyncStorage.getItem('total_gems');
      
      setTotalGems(gemValue != null ? parseInt(gemValue) : 0);
      setProgress({
        unlocked: parseInt(categoryData.unlocked) || 1,
        scores: (categoryData.scores || Array(9).fill(0)).map(s => parseInt(s))
      });
    } catch (e) { console.error(e); }
  };

  const renderPathSegments = () => {
    const paths = [];
    for (let i = 0; i < levels.length - 1; i++) {
      const curr = levels[i];
      const next = levels[i + 1];
      const cpX = (curr.x + next.x) / 2 + (i % 2 === 0 ? 80 : -80);
      const cpY = (curr.y + next.y) / 2;
      const d = `M ${curr.x} ${curr.y} Q ${cpX} ${cpY}, ${next.x} ${next.y}`;
      const isCompletedSegment = next.id <= progress.unlocked;

      paths.push(
        <Path 
          key={`path-${i}`}
          d={d} 
          fill="none" 
          stroke={isCompletedSegment ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.2)"} 
          strokeWidth={isCompletedSegment ? "10" : "6"} 
          strokeDasharray={isCompletedSegment ? "1, 15" : "10, 5"}
          strokeLinecap="round"
        />
      );
    }
    return paths;
  };

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        <Svg height="100%" width="100%">
          <Defs>
            <LinearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#4facfe" /><Stop offset="100%" stopColor="#00f2fe" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#bgGrad)" />
        </Svg>
      </View>

      <ScrollView 
        ref={scrollRef} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ height: MAP_HEIGHT }} 
        bounces={true}
      >
        <Svg height={MAP_HEIGHT} width={width}>
          <Defs>
            <LinearGradient id="candyPink" x1="0" y1="0" x2="0" y2="1"><Stop offset="0%" stopColor="#ff9a9e" /><Stop offset="100%" stopColor="#fecfef" /></LinearGradient>
            <LinearGradient id="candyBlue" x1="0" y1="0" x2="0" y2="1"><Stop offset="0%" stopColor="#a1c4fd" /><Stop offset="100%" stopColor="#c2e9fb" /></LinearGradient>
            <LinearGradient id="candyYellow" x1="0" y1="0" x2="0" y2="1"><Stop offset="0%" stopColor="#f6d365" /><Stop offset="100%" stopColor="#fda085" /></LinearGradient>
            <LinearGradient id="unlockedGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FFF200" /><Stop offset="100%" stopColor="#FF9000" />
            </LinearGradient>
          </Defs>
          
          {renderPathSegments()}

          {levels.map((level, index) => {
            const isLocked = level.id > progress.unlocked;
            const isCurrent = level.id === progress.unlocked;
            const bestScore = progress.scores[index] || 0;

            return (
              <G key={level.id} onPress={() => !isLocked && router.push({ pathname: '/quiz/App', params: { ...params, level: level.id } })}>
                {isCurrent && (
                  <Circle cx={level.x} cy={level.y} r="38" fill="rgba(255, 255, 255, 0.3)" />
                )}
                
                <Circle cx={level.x + 2} cy={level.y + 4} r="28" fill="rgba(0,0,0,0.12)" />
                <Circle 
                  cx={level.x} cy={level.y} r="28" 
                  fill={isLocked ? "#b2bec3" : (isCurrent ? "url(#unlockedGrad)" : `url(#${level.grad})`)} 
                  stroke={isCurrent ? "#FFF" : "white"} 
                  strokeWidth={isCurrent ? "6" : "4"} 
                />
                <SvgText x={level.x} y={level.y + 7} fill={isLocked ? "white" : (isCurrent ? "#6B4300" : "#57606f")} fontSize="18" fontWeight="900" textAnchor="middle">
                  {isLocked ? "🔒" : level.id}
                </SvgText>
                
                {!isLocked && bestScore > 0 && (
                  <G>
                    <Circle cx={level.x + 22} cy={level.y - 22} r="12" fill="#ff4757" stroke="white" strokeWidth="2" />
                    <SvgText x={level.x + 22} y={level.y - 18} fill="white" fontSize="9" fontWeight="bold" textAnchor="middle">{bestScore}%</SvgText>
                  </G>
                )}
              </G>
            );
          })}
        </Svg>
      </ScrollView>

      <SafeAreaView style={styles.headerContainer} pointerEvents="box-none">
        <View style={styles.glassHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.categoryText} numberOfLines={1}>{name.toUpperCase()}</Text>
            <View style={styles.headerDivider} />
            <Text style={styles.difficultyText}>{difficulty}</Text>
          </View>
          
          {/* UPDATED GEM BADGE WITH GEM ICON */}
          <View style={styles.gemBadge}>
            <Text style={styles.gemText}>{totalGems}</Text>
            <Ionicons name="diamond" size={18} color="#00E5FF" />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#4facfe' },
  headerContainer: { position: 'absolute', top: Platform.OS === 'ios' ? 0 : 30, left: 0, right: 0, paddingHorizontal: 15, zIndex: 100 },
  glassHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255, 255, 255, 0.9)', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.5)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8, marginTop: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  categoryText: { color: '#2f3542', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  headerDivider: { width: 1, height: 14, backgroundColor: 'rgba(0,0,0,0.1)', marginHorizontal: 10 },
  difficultyText: { color: '#747d8c', fontSize: 12, fontWeight: '700' },
  gemBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0, 229, 255, 0.1)', // Light cyan background
    paddingHorizontal: 14, 
    paddingVertical: 6, 
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.4)' // Diamond-colored border
  },
  gemText: { color: '#00BCD4', fontSize: 16, fontWeight: '900', marginRight: 6 }
});
