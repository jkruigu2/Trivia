import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D1B4E', 
  },
  // --- HEADER SECTION ---
  headerContainer: {
    backgroundColor: '#7C3AED', 
    paddingBottom: 0, // Set to 0 so progress bar touches the bottom
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 10,
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    overflow: 'hidden', // Ensures progress bar respects the border radius
  },
  headerPaused: {
    backgroundColor: '#EF4444', // Switched to Red as requested
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 70, // Fixed height to keep icons aligned
    backgroundColor: 'transparent', 
  },
  // --- TIMER & STATS (Unified Sizing) ---
  timerCircle: {
    width: 50, // Standardized size
    height: 50, 
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F472B6', 
  },
  timerUrgent: {
    backgroundColor: '#EF4444',
    borderColor: '#FFFFFF',
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 18, // Balanced size
    fontWeight: '900',
  },
  livesText: {
    fontSize: 25, // Matches visual weight of timer
    textAlign: 'center',
    minWidth: 50, // Keeps spacing consistent with timer circle
  },
  percentageBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 12,
    height: 50, // Matches height of timerCircle
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  // --- PROGRESS BAR (Edge to Edge) ---
  progressContainer: {
    height: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    width: '100%', // Edge to edge
    marginTop: 15,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#EC4899', 
    // Removed border radius for a clean "filling" look
  },
  // --- QUESTION CARD ---
  questionCard: {
    backgroundColor: '#3D2B5E',
    margin: 20,
    padding: 25,
    borderRadius: 28,
    elevation: 12,
    shadowColor: '#EC4899', 
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
  questionText: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: '#FFFFFF',
    lineHeight: 32,
  },
  // --- OPTIONS ---
  optionsContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  option: {
    backgroundColor: '#4C1D95',
    borderWidth: 2,
    borderColor: '#6D28D9',
    borderRadius: 20,
    padding: 18,
    marginVertical: 8,
    elevation: 4,
  },
  optionCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  optionWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  optionText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#F9A8D4',
    fontWeight: '700',
  },
  // --- OVERLAYS & MODALS ---
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(45, 27, 78, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  modal: {
    backgroundColor: '#3D2B5E',
    padding: 30,
    borderRadius: 35,
    width: '85%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EC4899',
  },
  modalTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 25,
  },
  modalBtn: {
    backgroundColor: '#EC4899',
    padding: 18,
    borderRadius: 18,
    width: '100%',
    marginBottom: 15,
  },
  modalBtnText: {
    color: 'white',
    fontWeight: '900',
    textAlign: 'center',
    fontSize: 18,
  },
  // --- GAME OVER ---
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#2D1B4E',
  },
  gameOverTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  finalScore: {
    fontSize: 72,
    fontWeight: '900',
    color: '#EC4899',
    marginVertical: 10,
  },
  restartBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 100,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#A78BFA',
  },
  restartBtnText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
