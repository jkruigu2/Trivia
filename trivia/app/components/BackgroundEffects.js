import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

 export const Star = () => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(Math.random() * 0.5 + 0.2)).current;
  const size = 1.5 + Math.random() * 3;
  const left = Math.random() * width;

  useEffect(() => {
    const fall = () => {
      translateY.setValue(-100);
      Animated.timing(translateY, {
        toValue: height + 100,
        duration: 14000 + Math.random() * 22000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => fall());
    };
    fall();
  }, [translateY]);

  return <Animated.View style={[styles.star, { left, width: size, height: size, borderRadius: size / 2, transform: [{ translateY }], opacity }]} />;
};

export const BackgroundGlow = () => (
  <View style={StyleSheet.absoluteFill}>
    <View style={[styles.glowOrb, { top: -height * 0.1, left: -width * 0.2, backgroundColor: '#4F46E5', width: width * 1.2, height: width * 1.2, opacity: 0.15 }]} />
    <View style={[styles.glowOrb, { bottom: height * 0.1, right: -width * 0.3, backgroundColor: '#E91E63', width: width, height: width, opacity: 0.1 }]} />
  </View>
);

const styles = StyleSheet.create({
  glowOrb: { position: 'absolute', borderRadius: 999 },
  star: { position: 'absolute', backgroundColor: '#ffffff' },
});
