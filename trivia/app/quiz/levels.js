import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, Alert } from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const levels = [
  { id: 1, x: width * 0.5,  y: height * 0.80, grad: "pinkGrad" },
  { id: 2, x: width * 0.3,  y: height * 0.75, grad: "purpleGrad" },
  { id: 3, x: width * 0.7,  y: height * 0.65, grad: "orangeGrad" },
  { id: 4, x: width * 0.5,  y: height * 0.55, grad: "pinkGrad" },
  { id: 5, x: width * 0.2,  y: height * 0.45, grad: "purpleGrad" },
  { id: 6, x: width * 0.5,  y: height * 0.35, grad: "orangeGrad" },
  { id: 7, x: width * 0.8,  y: height * 0.25, grad: "purpleGrad" },
  { id: 8, x: width * 0.5,  y: height * 0.15, grad: "orangeGrad" },
  { id: 9, x: width * 0.2,  y: height * 0.15, grad: "pinkGrad" },
];

export default function LevelMap() {
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const router = useRouter();
  const params = useLocalSearchParams();

  const generatePath = () => {
    if (levels.length < 2) return "";
    let d = `M ${levels[0].x} ${levels[0].y}`;
    for (let i = 0; i < levels.length - 1; i++) {
      const curr = levels[i];
      const next = levels[i + 1];
      const cpX = (curr.x + next.x) / 2 + (i % 2 === 0 ? 50 : -50);
      const cpY = (curr.y + next.y) / 2;
      d += ` Q ${cpX} ${cpY}, ${next.x} ${next.y}`;
    }
    return d;
  };

  const getData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('levelData');
      let data;
      
      if (jsonValue === null) {
        data = {
          'counties': [1, 1, 1],
          'culture': [1, 1, 1],
          'world': [1, 1, 1],
          'president': [1, 1, 1],
          'history': [1, 1, 1],
          'geography': [1, 1, 1]
        };
        await AsyncStorage.setItem('levelData', JSON.stringify(data));
      } else {
        data = JSON.parse(jsonValue);
      }

      const diffIndex = params.difficulty === 'easy' ? 0 : params.difficulty === 'medium' ? 1 : 2;
      return data[params.name] ? data[params.name][diffIndex] : 1;
    } catch (e) {
      return 1;
    }
  };

  useEffect(() => {
    const fetchProgress = async () => {
      const level = await getData();
      setUnlockedLevel(level);
    };
    fetchProgress();
  }, [params]); // Re-run if params change

  const handleLevelPress = (levelId) => {
    if (levelId <= unlockedLevel) {
      router.push({
        pathname: '/quiz/App',
        params: { ...params, level: levelId },
      });
    } else {
      // Logic for locked level alert
      Alert.alert(
        "Level Locked",
        "You must pass the previous level with a perfect score to unlock this one!",
        [{ text: "OK", style: "default" }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <Svg height="100%" width="100%">
        <Defs>
          <LinearGradient id="pinkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FF85C1" />
            <Stop offset="100%" stopColor="#D4145A" />
          </LinearGradient>
          <LinearGradient id="purpleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#CD93FF" />
            <Stop offset="100%" stopColor="#662D8C" />
          </LinearGradient>
          <LinearGradient id="orangeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FBB03B" />
            <Stop offset="100%" stopColor="#D4145A" />
          </LinearGradient>
        </Defs>

        <Path
          d={generatePath()}
          fill="none"
          stroke="white"
          strokeWidth="6"
          strokeDasharray="10, 8"
          opacity={0.3}
        />

        {levels.map((level) => {
          const isLocked = level.id > unlockedLevel;
          return (
            <G key={level.id} onPress={() => handleLevelPress(level.id)}>
              <Circle cx={level.x} cy={level.y} r="28" fill="white" opacity={0.2} />
              <Circle 
                cx={level.x} 
                cy={level.y} 
                r="24" 
                fill={`url(#${level.grad})`} 
                stroke="white" 
                strokeWidth="2" 
                opacity={isLocked ? 0.5 : 1}
              />
              <SvgText
                x={level.x}
                y={level.y + 5}
                fill="white"
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
              >
                {isLocked ? "🔒" : level.id}
              </SvgText>
            </G>
          );
        })}
      </Svg>

      <View style={styles.header}>
        <View style={styles.stats}>
          <Text style={styles.statText}>Progress: Level {unlockedLevel}</Text>
        </View>
        <View style={styles.stats}>
          <Text style={styles.statText}>💰 60</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#79CBCA', justifyContent: 'center' },
  header: {
    position: 'absolute',
    top: 50,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stats: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  statText: { color: 'white', fontWeight: 'bold' }
});
