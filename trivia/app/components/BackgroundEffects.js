import React, { useEffect, useRef, memo } from 'react';
import { StyleSheet, View, Animated, Easing, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Memoizing prevents unnecessary re-renders when parent state changes
export const Star = memo(() => {
  const translateY = useRef(new Animated.Value(-20)).current;
  
  // Use useMemo or constants outside the render for static random values
  const config = useRef({
    size: 1.5 + Math.random() * 3,
    left: Math.random() * width,
    duration: 15000 + Math.random() * 20000,
    opacity: Math.random() * 0.6 + 0.2,
  }).current;

  useEffect(() => {
    const startAnimation = () => {
      translateY.setValue(-20);
      Animated.timing(translateY, {
        toValue: height + 20,
        duration: config.duration,
        easing: Easing.linear,
        useNativeDriver: true, // Crucial for smooth performance
      }).start(() => startAnimation());
    };
    
    startAnimation();
  }, [translateY, config.duration]);

  return (
    <Animated.View 
      style={[
        styles.star, 
        { 
          left: config.left, 
          width: config.size, 
          height: config.size, 
          borderRadius: config.size / 2, 
          opacity: config.opacity,
          transform: [{ translateY }] 
        }
      ]} 
    />
  );
});

export const BackgroundGlow = () => (
  <View style={[StyleSheet.absoluteFill, styles.pinkBackground]}>
    {/* Top-left soft pink glow */}
    <View style={[styles.glowOrb, styles.topGlow]} />
    {/* Bottom-right deeper pink/magenta glow */}
    <View style={[styles.glowOrb, styles.bottomGlow]} />
  </View>
);

const styles = StyleSheet.create({
  pinkBackground: {
    backgroundColor: '#FBDFE9', // Soft pastel pink base
  },
  glowOrb: { 
    position: 'absolute', 
    borderRadius: 999 
  },
  topGlow: {
    top: -height * 0.2,
    left: -width * 0.2,
    backgroundColor: '#FFB6C1', // Light Pink
    width: width * 1.5,
    height: width * 1.5,
    opacity: 0.4,
  },
  bottomGlow: {
    bottom: -height * 0.1,
    right: -width * 0.3,
    backgroundColor: '#F06292', // Deeper Pink
    width: width * 1.2,
    height: width * 1.2,
    opacity: 0.3,
  },
  star: { 
    position: 'absolute', 
    backgroundColor: '#FFFFFF',
    // Slight shadow makes stars pop on pink background
    shadowColor: "#FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
});
