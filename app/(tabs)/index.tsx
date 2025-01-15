import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, FlatList, TextInput, Pressable, Platform, View, Modal, KeyboardAvoidingView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type IoniconsNames = keyof typeof Ionicons.glyphMap;

interface Category {
  id: string;
  name: string;
  icon: IoniconsNames;
  color: string;
}

const CATEGORIES: Category[] = [
  { id: 'personal', name: 'Personal', icon: 'person-outline', color: '#4158D0' },
  { id: 'work', name: 'Work', icon: 'briefcase-outline', color: '#C850C0' },
  { id: 'shopping', name: 'Shopping', icon: 'cart-outline', color: '#FF6B6B' },
  { id: 'home', name: 'Home', icon: 'home-outline', color: '#4CAF50' },
  { id: 'health', name: 'Health', icon: 'fitness-outline', color: '#FF9800' },
];

interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: Category;
}

type HapticStyle = 'light' | 'medium' | 'success';

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>(CATEGORIES[0]);
  const [showCategories, setShowCategories] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const triggerHaptic = useCallback(async (style: HapticStyle) => {
    if (Platform.OS !== 'web') {
      try {
        if (style === 'success') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (style === 'medium') {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch (error) {
        console.log('Haptics not available');
      }
    }
  }, []);

  useEffect(() => {
    if (totalTasks > 0 && completedTasks === totalTasks) {
      triggerHaptic('success');
      setShowCongrats(true);
    }
  }, [completedTasks, totalTasks, triggerHaptic]);

  const addTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      completed: false,
      category: selectedCategory,
    };

    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setShowCategories(false);
    triggerHaptic('light');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
    triggerHaptic('light');
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
    triggerHaptic('medium');
  };

  return (
    <>
      <StatusBar style="light" />
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'left', 'right']}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoid}
        >
          <LinearGradient
            colors={['#4158D0', '#C850C0', '#FFCC70']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <ThemedView style={styles.container}>
              <ThemedView style={styles.headerContainer}>
                <ThemedText style={styles.logoText}>Taskly</ThemedText>
                <ThemedText style={styles.tagline}>Organize your day with ease</ThemedText>
              </ThemedView>

              <ThemedView style={styles.progressContainer}>
                <ThemedText type="subtitle">Overall Progress</ThemedText>
                <ThemedView style={styles.progressBarContainer}>
                  <ThemedView
                    style={[
                      styles.progressBar,
                      { width: Math.min(progress, 100) + '%' },
                      { backgroundColor: '#4158D0' }
                    ]}
                  />
                </ThemedView>
                <ThemedText style={styles.progressText}>
                  {completedTasks} of {totalTasks} tasks completed ({Math.round(progress)}%)
                </ThemedText>
              </ThemedView>

              <ThemedView style={styles.inputCard}>
                <View style={styles.categoryRow}>
                  {CATEGORIES.map((category) => (
                    <Pressable
                      key={category.id}
                      style={[
                        styles.categoryIcon,
                        selectedCategory.id === category.id && [
                          styles.selectedCategoryIcon,
                          { borderColor: category.color }
                        ],
                        { backgroundColor: `${category.color}15` }
                      ]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Ionicons
                        name={category.icon}
                        size={24}
                        color={category.color}
                        style={[
                          selectedCategory.id === category.id
                            ? { transform: [{ scale: 1.3 }] }
                            : { transform: [{ scale: 0.9 }], opacity: 0.5 }
                        ]}
                      />
                    </Pressable>
                  ))}
                </View>

                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, { color: Colors[colorScheme].text }]}
                    value={newTaskTitle}
                    onChangeText={setNewTaskTitle}
                    placeholder="Add a new task..."
                    placeholderTextColor="rgba(0,0,0,0.5)"
                    onSubmitEditing={addTask}
                  />
                  <Pressable
                    onPress={addTask}
                    style={[styles.addButton, { backgroundColor: selectedCategory.color }]}
                  >
                    <Ionicons name="add-outline" size={24} color="white" />
                  </Pressable>
                </View>
              </ThemedView>

              <FlatList
                data={tasks}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable onPress={() => toggleTask(item.id)}>
                    <ThemedView style={styles.taskItem}>
                      <Pressable
                        style={[styles.checkbox, item.completed && styles.checkboxChecked]}
                        onPress={() => toggleTask(item.id)}
                      >
                        {item.completed && (
                          <Ionicons name="checkmark-outline" size={18} color="white" />
                        )}
                      </Pressable>
                      <ThemedText
                        style={[styles.taskText, item.completed && styles.taskTextCompleted]}
                      >
                        {item.title}
                      </ThemedText>
                      <ThemedText style={styles.categoryTag}>{item.category.name}</ThemedText>
                      <Pressable
                        onPress={() => deleteTask(item.id)}
                        style={styles.deleteButton}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="rgba(0,0,0,0.5)"
                        />
                      </Pressable>
                    </ThemedView>
                  </Pressable>
                )}
                style={styles.list}
                showsVerticalScrollIndicator={false}
              />

              <Modal
                animationType="fade"
                transparent={true}
                visible={showCongrats}
                onRequestClose={() => setShowCongrats(false)}
              >
                <Pressable
                  style={styles.modalOverlay}
                  onPress={() => setShowCongrats(false)}
                >
                  <ThemedView style={styles.congratsContainer}>
                    <ThemedText style={styles.congratsTitle}>🎉 Congratulations! 🎉</ThemedText>
                    <ThemedText style={styles.congratsText}>
                      You've completed all your tasks!
                    </ThemedText>
                    <Pressable
                      style={styles.closeButton}
                      onPress={() => setShowCongrats(false)}
                    >
                      <ThemedText style={styles.closeButtonText}>Close</ThemedText>
                    </Pressable>
                  </ThemedView>
                </Pressable>
              </Modal>
            </ThemedView>
          </LinearGradient>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#4158D0',
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'transparent',
  },
  headerContainer: {
    marginBottom: 30,
    backgroundColor: 'transparent',
    paddingTop: 10,
  },
  logoText: {
    fontSize: 44,
    fontWeight: Platform.select({ ios: '800', android: 'bold' }),
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
    marginTop: 8,
  },
  progressContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    marginVertical: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.6)',
  },
  inputCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  selectedCategoryIcon: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  list: {
    flex: 1,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4158D0',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4158D0',
  },
  taskText: {
    flex: 1,
    fontSize: 16,
    color: 'rgba(0,0,0,0.8)',
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  deleteButton: {
    padding: 8,
  },
  categoryTag: {
    fontSize: 12,
    color: '#4158D0',
    backgroundColor: 'rgba(65, 88, 208, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  congratsContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    width: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  congratsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  congratsText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: 'rgba(0,0,0,0.8)',
  },
  closeButton: {
    backgroundColor: '#4158D0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: Platform.select({ ios: '600', android: 'bold' }),
  },
  keyboardAvoid: {
    flex: 1,
  },
});
