// styles.js
import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f2f', // darker background to make stars pop
  },
  retryHint: {
  color: '#FFA500', // Orange/Gold
  fontSize: 16,
  marginBottom: 10,
  textAlign: 'center',
},
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.85)',
    paddingTop: 50,
  },
  headerLeft: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timer: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  timerDanger: {
    color: '#FFAAAA',
  },
  livesText: {
    fontSize: 18,
  },
  pauseBtnSmall: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 10,
  },
  pauseText: {
    color: 'white',
    fontSize: 18,
  },
  progressContainer: {
    height: 6,
    backgroundColor: 'rgba(226, 232, 240, 0.3)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34D399',
  },
  questionCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    margin: 20,
    padding: 25,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1E293B',
  },
  optionsContainer: {
    paddingHorizontal: 20,
  },
  option: {
    backgroundColor: 'rgba(239, 246, 255, 0.9)',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    borderRadius: 15,
    padding: 18,
    marginVertical: 8,
  },
  optionCorrect: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  optionWrong: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  optionText: {
    fontSize: 17,
    textAlign: 'center',
    color: '#1E40AF',
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#ffffff',
  },
  finalScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#A5B4FC',
    marginBottom: 10,
  },
  statText: {
    fontSize: 16,
    color: '#CBD5E1',
    marginBottom: 30,
  },
  restartBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginVertical: 8,
  },
  restartBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  modal: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modalBtn: {
    backgroundColor: '#10B981',
    padding: 15,
    borderRadius: 12,
    width: '100%',
    marginBottom: 10,
  },
  modalBtnText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 18,
  },
});




