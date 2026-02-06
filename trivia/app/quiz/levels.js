import React from 'react';
import { StyleSheet, View, Text, Dimensions, Alert } from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// We use percentages of the actual screen height now
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

const LevelMap = () => {
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
  
  const storeData = async (value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem('levelData', jsonValue);
  } catch (e) {
    // saving error
  }
};

// Reading data
 async function getData() {
    const jsonValue = await AsyncStorage.getItem('levelData');
     if(jsonValue === null){
        JSON.parse(storeData({
          'counties':[1,1,1],
          'culture':[1,1,1],
          'world':[1,1,1],
          'president':[1,1,1],
          'history':[1,1,1],
          'geography':[1,1,1]
        }))
       }else{
         var data = JSON.parse(jsonValue)
         let x = params.difficulty === 'easy'?0:params.didifficulty === 'medium'?1:2;
         return data[`${params.name}`][x]
       }
};



const handleLevel = async ({level}) => {
    const {id}=level;
    const l = await getData();
   // if(id <= l){
     router.push({
       pathname: '/quiz/QuizScreen',
       params: {
         ...params,
         level:id
       },
     });
   // }
  };
  return (
    <View style={styles.container}>
      {/* Svg now simply fills the flex container */}
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
          opacity={0.4}
        />

        {levels.map((level) => (
          <G 
            key={level.id} 
            onPress={() => handleLevel({level})}
          >
            <Circle cx={level.x} cy={level.y} r="28" fill="white" opacity={0.2} />
            <Circle 
              cx={level.x} 
              cy={level.y} 
              r="24" 
              fill={`url(#${level.grad})`} 
              stroke="white" 
              strokeWidth="2" 
            />
            <SvgText
              x={level.x}
              y={level.y + 5}
              fill="white"
              fontSize="12"
              fontWeight="bold"
              textAnchor="middle"
            >
              {level.id}
            </SvgText>
          </G>
        ))}
      </Svg>

      {/* Fixed UI Header */}
      <View style={styles.header}>
        <View style={styles.stats}><Text style={styles.statText}>❤️ 1</Text></View>
        <View style={styles.stats}><Text style={styles.statText}>💰 60</Text></View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#79CBCA',
    justifyContent: 'center'
  },
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

export default LevelMap;