import { StyleSheet, Dimensions } from 'react-native';
const { width } = Dimensions.get('window');
const GAP = 16;
const HORIZONTAL_PADDING = 20;
const availableWidth = width - HORIZONTAL_PADDING * 2;
const buttonWidth = (availableWidth - GAP) / 2;


 export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#9129d6' },
  glowOrb: { position: 'absolute', borderRadius: 999 },
  starElement: { position: 'absolute', backgroundColor: '#9129d6' },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingsButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  title: { fontSize: 22, fontWeight: '900', color: '#F1F5F9' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContentWhite: { width: width * 0.85, backgroundColor: '#9129d6', borderRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitleBlack: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  settingRowBlack: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  settingTextBlack: { color: '#334155', fontSize: 16, fontWeight: '600' },
  doneButton: { marginTop: 25, backgroundColor: '#4F46E5', paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  doneButtonText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  difficultyButtonsContainer: { flexDirection: 'row', paddingHorizontal: 20, justifyContent: 'space-between', marginBottom: 20 },
  difficultyButton: { flex: 1, marginHorizontal: 6, paddingVertical: 12, borderRadius: 16, borderWidth: 1.5, borderColor: '#334155', alignItems: 'center' },
  difficultyButtonText: { fontSize: 15, fontWeight: '700', color: '#94A3B8' },
  categoriesScroll: { flex: 1 },
  categoriesContent: { paddingBottom: 40 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#CBD5E1', marginBottom: 16, paddingHorizontal: 24 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: HORIZONTAL_PADDING, gap: GAP },
  categoryButton: { width: buttonWidth, aspectRatio: 1, borderRadius: 28, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  categoryIcon: { fontSize: 48, marginBottom: 8 },
  categoryName: { color: '#9129d6', fontSize: 16, fontWeight: '800', textAlign: 'center' },
});