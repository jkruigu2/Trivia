import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const cardWidth = (width - 40 - 16) / 2; // (Total Width - Padding - Gap) / 2

 export const CategoryCard = ({ category, onPress }) => (
  <TouchableOpacity
    style={[styles.card, { backgroundColor: category.color + 'CC' }]}
    onPress={onPress}
  >
    <Text style={styles.icon}>{category.icon}</Text>
    <Text style={styles.name}>{category.name.toUpperCase()}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: { width: cardWidth, aspectRatio: 1, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  icon: { fontSize: 48, marginBottom: 8 },
  name: { color: '#ffffff', fontSize: 16, fontWeight: '800', textAlign: 'center' },
});