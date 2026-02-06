import React, { useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');
const GAP = 16;
const HORIZONTAL_PADDING = 20;
const availableWidth = width - HORIZONTAL_PADDING * 2;
const buttonWidth = (availableWidth - GAP) / 2;

// ────────────────────────────────────────────────
//  Background Glow
// ────────────────────────────────────────────────
const BackgroundGlow = () => (
  <View style={StyleSheet.absoluteFill}>
    {/* Primary Purple Glow */}
    <View
      style={[
        styles.glowOrb,
        {
          top: -height * 0.1,
          left: -width * 0.2,
          backgroundColor: '#4F46E5',
          width: width * 1.2,
          height: width * 1.2,
          opacity: 0.15,
        },
      ]}
    />
    {/* Secondary Pink Glow */}
    <View
      style={[
        styles.glowOrb,
        {
          bottom: height * 0.1,
          right: -width * 0.3,
          backgroundColor: '#E91E63',
          width: width,
          height: width,
          opacity: 0.1,
        },
      ]}
    />
  </View>
);

// ────────────────────────────────────────────────
//  Single Star (using classic Animated API)
// ────────────────────────────────────────────────
const Star = ({ index }: { index: number }) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;

  const size = 1.5 + Math.random() * 3;              // 1.5–4.5 px
  const left = Math.random() * width;
  const fallDuration = 14000 + Math.random() * 22000; // 14–36 seconds → slow trickle
  const delay = Math.random() * 8000;                 // stagger start

  useEffect(() => {
    // Fall animation (infinite loop)
    const fall = () => {
      translateY.setValue(-100 - Math.random() * height * 0.4);
      opacity.setValue(0.3 + Math.random() * 0.5);

      Animated.sequence([
        Animated.delay(delay + index * 80), // slight stagger per star
        Animated.timing(translateY, {
          toValue: height + 100,
          duration: fallDuration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start(() => {
        fall(); // loop forever
      });
    };

    fall();

    // Independent twinkle (runs in parallel forever)
    const twinkle = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 800 + Math.random() * 1600,
          easing: Easing.inOutSine,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3 + Math.random() * 0.4,
          duration: 900 + Math.random() * 1800,
          easing: Easing.inOutSine,
          useNativeDriver: true,
        }),
      ])
    );
    twinkle.start();

    return () => {
      twinkle.stop();
    };
  }, []);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#ffffff',
          shadowColor: '#d1c4ff',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 6,
          elevation: 4,
        },
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    />
  );
};

// ────────────────────────────────────────────────
//  Stars Container
// ────────────────────────────────────────────────
const Stars = () => {
  const count = 65; // 50–80 is usually a good balance

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} index={i} />
      ))}
    </>
  );
};

// ────────────────────────────────────────────────
//  Data
// ────────────────────────────────────────────────
const difficulties = [
  { label: 'Easy', value: 'easy', questions: 10, color: '#4CAF50' },
  { label: 'Medium', value: 'medium', questions: 15, color: '#FF9800' },
  { label: 'Hard', value: 'hard', questions: 20, color: '#F44336' },
];

const categories = [
  { name: 'Counties',     color: '#3F51B5', icon: '🇰🇪'},
  { name: 'History',    color: '#2196F3', icon: '🌅' },
  { name: 'Culture',    color: '#F44336', icon: '📜' },
  { name: 'Geography',  color: '#4CAF50', icon: '🏔️' },
  { name: 'World', color: '#607D8B', icon: '🌍' },
  { name: 'President',  color: '#E91E63', icon: '👔' },
];

// ────────────────────────────────────────────────
//  Main Home Screen
// ────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const [selectedDifficulty, setSelectedDifficulty] = React.useState('easy');

  const selectedInfo =
    difficulties.find((d) => d.value === selectedDifficulty) || difficulties[0];

  const handleCategoryPress = (categoryName: string) => {
    router.push({
      pathname: '/quiz/Levels',
      params: {
        name: categoryName.toLowerCase(),
        difficulty: selectedDifficulty,
        questions: selectedInfo.questions.toString(),
      },
    });
  };

  return (
    <View style={styles.container}>
      <BackgroundGlow />
      <Stars />

      <View style={styles.header}>
        <Text style={styles.title}>The Kenyan Trivia</Text>
      </View>

      <View style={styles.difficultySection}>
        <View style={styles.difficultyButtonsContainer}>
          {difficulties.map((diff) => (
            <TouchableOpacity
              key={diff.value}
              activeOpacity={0.8}
              style={[
                styles.difficultyButton,
                selectedDifficulty === diff.value && {
                  backgroundColor: diff.color,
                  borderColor: diff.color,
                },
              ]}
              onPress={() => setSelectedDifficulty(diff.value)}
            >
              <Text
                style={[
                  styles.difficultyButtonText,
                  selectedDifficulty === diff.value && { color: '#ffffff' },
                ]}
              >
                {diff.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.categoriesScroll} contentContainerStyle={styles.categoriesContent}>
        <Text style={styles.sectionTitle}>Choose Category</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.name}
              style={[styles.categoryButton, { backgroundColor: category.color + 'CC' }]}
              activeOpacity={0.88}
              onPress={() => handleCategoryPress(category.name)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {selectedInfo.label} mode • Select a category to start!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  glowOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F1F5F9',
    textShadowColor: 'rgba(99, 102, 241, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  difficultySection: {
    marginVertical: 16,
  },
  difficultyButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  difficultyButton: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#334155',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    alignItems: 'center',
  },
  difficultyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#94A3B8',
  },
  categoriesScroll: {
    flex: 1,
  },
  categoriesContent: {
    paddingBottom: 40,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: GAP,
  },
  categoryButton: {
    width: buttonWidth,
    aspectRatio: 1,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  categoryIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  categoryName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51, 65, 85, 0.5)',
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
  },
});