// styles.js updated for a brighter, modern look
import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Brighter, light-grey/blue background
  },
  retryHint: {
    color: '#D97706', // Deeper orange for better visibility on light bg
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '500',
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
    backgroundColor: '#4F46E5', // Bright Indigo
    paddingTop: 50,
    borderBottomLeftRadius: 20,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Add these to your styles.js
  headerContainer: {
    backgroundColor: '#4F46E5', // Default Bright Indigo
    paddingBottom: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 5,
    // Add a transition-like feel by ensuring the base header has no extra padding
  },
  headerPaused: {
    backgroundColor: '#EF4444', // Bright Red when paused
  },
  header: {
    // Make sure your header background is transparent so the container color shows through
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: 'transparent', 
  },
  timer: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  timerDanger: {
    color: '#FECACA', // Light red for danger against dark header
  },
  livesText: {
    fontSize: 20,
  },
  pauseBtnSmall: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    padding: 8,
    borderRadius: 12,
  },
  pauseText: {
    color: 'white',
    fontSize: 18,
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981', // Vibrant Emerald
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 30,
    borderRadius: 24,
    // Stronger shadows for a "bright" layered effect
    elevation: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  questionText: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1E293B', // Dark slate for sharp readability
    lineHeight: 28,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  option: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
  },
  optionCorrect: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  optionWrong: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  optionText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#334155',
    fontWeight: '600',
  },
  gameOverTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1E293B',
  },
  finalScore: {
    fontSize: 56,
    fontWeight: '900',
    color: '#4F46E5',
    marginBottom: 10,
  },
  statText: {
    fontSize: 18,
    color: '#64748B',
    marginBottom: 30,
  },
  restartBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 18,
    paddingHorizontal: 50,
    borderRadius: 16,
    marginVertical: 8,
    elevation: 4,
  },
  restartBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.7)', // Slightly darker overlay for focus
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 25,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 20,
  },
  modalBtn: {
    backgroundColor: '#10B981',
    padding: 18,
    borderRadius: 15,
    width: '100%',
    marginBottom: 12,
  },
  modalBtnText: {
    color: 'white',
    fontWeight: '800',
    textAlign: 'center',
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Add/Update these in your styles.js
  headerContainer: {
    backgroundColor: '#4F46E5', // Matching the bright indigo
    paddingBottom: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 5,
  },
  percentageBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  timerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#34D399', // Green border for safe time
  },
  timerUrgent: {
    backgroundColor: '#EF4444', // Red background when low
    borderColor: '#FECACA',
    transform: [{ scale: 1.1 }], // Slightly larger to grab attention
  },
  progressContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 25,
    marginTop: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34D399', // Bright neon green progress
    borderRadius: 10,
  },

});
