import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Using fixed map height prevents angle distortion across devices
const MAP_HEIGHT = 2200;
const LEVEL_COUNT = 9;
const PADDING_TOP = 180;
const PADDING_BOTTOM = 180;

const levels = Array.from({ length: LEVEL_COUNT }, (_, i) => {
  let xPos = width * 0.5;
  if (i % 4 === 1) xPos = width * 0.24;
  if (i % 4 === 3) xPos = width * 0.76;

  return {
    id: i + 1,
    x: xPos,
    y: PADDING_TOP + i * ((MAP_HEIGHT - PADDING_TOP - PADDING_BOTTOM) / (LEVEL_COUNT - 1)),
    grad: i % 3 === 0 ? 'candyPink' : i % 3 === 1 ? 'candyBlue' : 'candyYellow',
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
  }, [name, difficulty]);

  useEffect(() => {
    if (progress.unlocked && scrollRef.current) {
      const currentLevel = levels.find((l) => l.id === progress.unlocked);
      if (currentLevel) {
        // Try to center the current level vertically
        const targetY = currentLevel.y - SCREEN_HEIGHT / 2 + 80; // slight offset upward
        const scrollToY = Math.max(0, Math.min(targetY, MAP_HEIGHT - SCREEN_HEIGHT));

        setTimeout(() => {
          scrollRef.current?.scrollTo({
            y: scrollToY,
            animated: true,
          });
        }, 400);
      }
    }
  }, [progress.unlocked]);

  const loadProgress = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('levelData');
      let data = jsonValue != null ? JSON.parse(jsonValue) : {};
      const categoryData = data[name]?.[difficulty] || {
        unlocked: 1,
        scores: Array(9).fill(0),
      };

      const gemValue = await AsyncStorage.getItem('total_gems');
      setTotalGems(gemValue != null ? parseInt(gemValue, 10) : 0);

      setProgress({
        unlocked: parseInt(categoryData.unlocked) || 1,
        scores: (categoryData.scores || Array(9).fill(0)).map((s) => parseInt(s, 10)),
      });
    } catch (e) {
      console.error('Failed to load progress:', e);
    }
  };

  const renderPathSegments = () => {
    return levels.map((curr, i) => {
      if (i === levels.length - 1) return null;
      const next = levels[i + 1];

      const dy = next.y - curr.y;
      const dx = next.x - curr.x;

      // Cubic Bézier control points - aligned vertically for reliable connection
      const cp1x = curr.x + dx * 0.1;           // slight horizontal pull
      const cp1y = curr.y + dy * 0.33;

      const cp2x = next.x - dx * 0.1;
      const cp2y = curr.y + dy * 0.67;

      const d = `M ${curr.x} ${curr.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;

      const isCompleted = next.id <= progress.unlocked;

      return (
        <G key={`path-group-${i}`}>
          {/* Subtle glow behind completed paths */}
          {isCompleted && (
            <Path
              d={d}
              fill="none"
              stroke="rgba(255, 240, 180, 0.28)"
              strokeWidth={22}
              strokeLinecap="round"
            />
          )}

          {/* Main path */}
          <Path
            d={d}
            fill="none"
            stroke={isCompleted ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.30)'}
            strokeWidth={isCompleted ? 12 : 7}
            strokeDasharray={isCompleted ? '2 14' : '10 6'}
            strokeLinecap="round"
          />
        </G>
      );
    });
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <View style={StyleSheet.absoluteFill}>
        <Svg height="100%" width="100%">
          <Defs>
            <LinearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#4facfe" />
              <Stop offset="100%" stopColor="#00f2fe" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#bgGrad)" />
        </Svg>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ height: MAP_HEIGHT, paddingBottom: 80 }}
        bounces={true}
      >
        <Svg height={MAP_HEIGHT} width={width}>
          <Defs>
            <LinearGradient id="candyPink" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#ff9a9e" />
              <Stop offset="100%" stopColor="#fecfef" />
            </LinearGradient>
            <LinearGradient id="candyBlue" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#a1c4fd" />
              <Stop offset="100%" stopColor="#c2e9fb" />
            </LinearGradient>
            <LinearGradient id="candyYellow" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#f6d365" />
              <Stop offset="100%" stopColor="#fda085" />
            </LinearGradient>
            <LinearGradient id="unlockedGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#FFF200" />
              <Stop offset="100%" stopColor="#FF9000" />
            </LinearGradient>
          </Defs>

          {/* Paths first (behind circles) */}
          {renderPathSegments()}

          {/* Level nodes */}
          {levels.map((level, index) => {
            const isLocked = level.id > progress.unlocked;
            const isCurrent = level.id === progress.unlocked;
            const bestScore = progress.scores[index] || 0;

            return (
              <G
                key={level.id}
                onPress={() => {
                  if (!isLocked) {
                    router.push({
                      pathname: '/quiz/App',
                      params: { ...params, level: level.id },
                    });
                  }
                }}
              >
                {/* Glow for current level */}
                {isCurrent && (
                  <Circle
                    cx={level.x}
                    cy={level.y}
                    r={44}
                    fill="rgba(255, 255, 255, 0.35)"
                  />
                )}

                {/* Shadow */}
                <Circle
                  cx={level.x + 2.5}
                  cy={level.y + 5}
                  r={30}
                  fill="rgba(0,0,0,0.2)"
                />

                {/* Main circle */}
                <Circle
                  cx={level.x}
                  cy={level.y}
                  r={30}
                  fill={
                    isLocked
                      ? '#a0aec0'
                      : isCurrent
                      ? 'url(#unlockedGrad)'
                      : `url(#${level.grad})`
                  }
                  stroke="white"
                  strokeWidth={isCurrent ? 7 : 4.5}
                />

                <SvgText
                  x={level.x}
                  y={level.y + 8}
                  fill={isLocked ? 'white' : isCurrent ? '#5c3a00' : '#4a5568'}
                  fontSize="22"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {isLocked ? '🔒' : level.id}
                </SvgText>

                {/* Score badge */}
                {!isLocked && bestScore > 0 && (
                  <G>
                    <Circle
                      cx={level.x + 24}
                      cy={level.y - 24}
                      r={15}
                      fill="#ff4757"
                      stroke="white"
                      strokeWidth={2.5}
                    />
                    <SvgText
                      x={level.x + 24}
                      y={level.y - 19}
                      fill="white"
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {bestScore}%
                    </SvgText>
                  </G>
                )}
              </G>
            );
          })}
        </Svg>
      </ScrollView>

      {/* Header */}
      <SafeAreaView style={styles.headerContainer} pointerEvents="box-none">
        <View style={styles.glassHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.categoryText} numberOfLines={1}>
              {name.toUpperCase()}
            </Text>
            <View style={styles.headerDivider} />
            <Text style={styles.difficultyText}>{difficulty}</Text>
          </View>

          <View style={styles.gemBadge}>
            <Text style={styles.gemText}>{totalGems}</Text>
            <Ionicons name="diamond" size={20} color="#00E5FF" />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4facfe',
  },
  headerContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 0 : 30,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 100,
  },
  glassHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
    marginTop: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryText: {
    color: '#1a202c',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  headerDivider: {
    width: 1.5,
    height: 16,
    backgroundColor: 'rgba(0,0,0,0.12)',
    marginHorizontal: 12,
  },
  difficultyText: {
    color: '#718096',
    fontSize: 13,
    fontWeight: '700',
  },
  gemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.45)',
  },
  gemText: {
    color: '#00BCD4',
    fontSize: 17,
    fontWeight: '900',
    marginRight: 6,
  },
});