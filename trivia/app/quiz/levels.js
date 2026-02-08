import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions, Alert, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Fixed map height to ensure consistent spacing regardless of screen size
const MAP_HEIGHT = 1100; 
const NODE_SPACING = 120; // Consistent vertical distance between levels

const levels = [
  { id: 1, x: width * 0.5,  y: MAP_HEIGHT - 100, grad: "pinkGrad" },
  { id: 2, x: width * 0.25, y: MAP_HEIGHT - (100 + NODE_SPACING), grad: "purpleGrad" },
  { id: 3, x: width * 0.75, y: MAP_HEIGHT - (100 + NODE_SPACING * 2), grad: "orangeGrad" },
  { id: 4, x: width * 0.5,  y: MAP_HEIGHT - (100 + NODE_SPACING * 3), grad: "pinkGrad" },
  { id: 5, x: width * 0.25, y: MAP_HEIGHT - (100 + NODE_SPACING * 4), grad: "purpleGrad" },
  { id: 6, x: width * 0.5,  y: MAP_HEIGHT - (100 + NODE_SPACING * 5), grad: "orangeGrad" },
  { id: 7, x: width * 0.75, y: MAP_HEIGHT - (100 + NODE_SPACING * 6), grad: "purpleGrad" },
  { id: 8, x: width * 0.5,  y: MAP_HEIGHT - (100 + NODE_SPACING * 7), grad: "orangeGrad" },
  { id: 9, x: width * 0.25, y: MAP_HEIGHT - (100 + NODE_SPACING * 8), grad: "pinkGrad" },
];

export default function LevelMap() {
  const [progress, setProgress] = useState({ unlocked: 1, scores: Array(9).fill(0) });
  const scrollRef = useRef(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const { name = 'Category', difficulty = 'Easy' } = params;

  useEffect(() => {
    loadProgress();
  }, [params]);

  const getSafeNumber = (val) => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  const loadProgress = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('levelData');
      let data = jsonValue != null ? JSON.parse(jsonValue) : {};
      
      const categoryData = data[name]?.[difficulty] || { unlocked: 1, scores: Array(9).fill(0) };
      
      setProgress({
        unlocked: getSafeNumber(categoryData.unlocked),
        scores: (categoryData.scores || Array(9).fill(0)).map(s => getSafeNumber(s))
      });
    } catch (e) {
      console.error("Storage load error:", e);
    }
  };

  const generatePath = () => {
    let d = `M ${levels[0].x} ${levels[0].y}`;
    for (let i = 0; i < levels.length - 1; i++) {
      const curr = levels[i];
      const next = levels[i + 1];
      const cpX = (curr.x + next.x) / 2 + (i % 2 === 0 ? 60 : -60);
      const cpY = (curr.y + next.y) / 2;
      d += ` Q ${cpX} ${cpY}, ${next.x} ${next.y}`;
    }
    return d;
  };

  return (
    <View style={styles.container}>
      {/* ALIGNED HEADER */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{name.toUpperCase()}</Text>
          <Text style={styles.subtitle}>{difficulty.toUpperCase()}</Text>
        </View>
      </SafeAreaView>

      <ScrollView 
        ref={scrollRef}
        contentContainerStyle={{ paddingTop: 120, paddingBottom: 50 }} 
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        <Svg height={MAP_HEIGHT} width={width}>
          <Defs>
            <LinearGradient id="pinkGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FF85C1" /><Stop offset="100%" stopColor="#D4145A" />
            </LinearGradient>
            <LinearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#CD93FF" /><Stop offset="100%" stopColor="#662D8C" />
            </LinearGradient>
            <LinearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FBB03B" /><Stop offset="100%" stopColor="#D4145A" />
            </LinearGradient>
          </Defs>

          <Path 
            d={generatePath()} 
            fill="none" 
            stroke="rgba(255,255,255,0.15)" 
            strokeWidth="5" 
            strokeDasharray="10,10" 
          />

          {levels.map((level, index) => {
            const isLocked = level.id > progress.unlocked;
            const bestScore = progress.scores[index] || 0;

            return (
              <G key={level.id}>
                {/* Level Node Group */}
                <G onPress={() => !isLocked && router.push({ pathname: '/quiz/App', params: { ...params, level: level.id, bestScore } })}>
                  <Circle cx={level.x} cy={level.y} r="32" fill="rgba(255,255,255,0.05)" />
                  <Circle 
                    cx={level.x} cy={level.y} r="26" 
                    fill={isLocked ? "#334155" : `url(#${level.grad})`} 
                    stroke="white" 
                    strokeWidth="2" 
                    opacity={isLocked ? 0.7 : 1}
                  />
                  <SvgText x={level.x} y={level.y + 6} fill="white" fontSize="16" fontWeight="bold" textAnchor="middle">
                    {isLocked ? "🔒" : level.id}
                  </SvgText>
                </G>

                {/* Info Icon */}
                {!isLocked && (
                  <G onPress={() => Alert.alert(`Level ${level.id}`, `Best Score: ${bestScore}%`)}>
                    <Circle cx={level.x + 22} cy={level.y - 22} r="11" fill="white" />
                    <SvgText x={level.x + 22} y={level.y - 18} fill="#1e293b" fontSize="12" fontWeight="900" textAnchor="middle">i</SvgText>
                  </G>
                )}
              </G>
            );
          })}
        </Svg>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 15 
  },
  title: { 
    color: 'white', 
    fontSize: 20, 
    fontWeight: '900', 
    letterSpacing: 1.5 
  },
  subtitle: { 
    color: '#94a3b8', 
    fontSize: 12, 
    fontWeight: 'bold', 
    marginTop: 2 
  },
});
