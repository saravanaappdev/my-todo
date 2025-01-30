import { useState } from 'react';
import { StyleSheet, FlatList, TextInput, Pressable, Platform, View, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTaskContext } from '@/contexts/TaskContext';

export default function HomeScreen() {
  const [newListTitle, setNewListTitle] = useState('');
  const colorScheme = useColorScheme() ?? 'light';
  const { taskLists, addTaskList, deleteTaskList, getOverallProgress } = useTaskContext();
  const overallProgress = getOverallProgress();

  const handleAddList = async () => {
    if (!newListTitle.trim()) return;
    await addTaskList(newListTitle);
    setNewListTitle('');
  };

  const handleDeleteList = (id: string, title: string) => {
    console.log('Deleting list: in handleDeleteList', id, title);
    Alert.alert('Delete List', `Are you sure you want to delete "${title}" and all its tasks?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteTaskList(id) }
    ]);

    // Alert.alert(
    //   "Delete List",
    //   `Are you sure you want to delete "${title}" and all its tasks?`,
    //   [
    //     { text: "Cancel", style: "cancel" },
    //     { text: "Delete", style: "destructive", onPress: () => deleteTaskList(id) }
    //   ]
    // );

    Alert.alert(
      "Delete List",
      `Are you sure you want to delete "${title}" and all its tasks?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTaskList(id);
            } catch (error) {
              console.error('Error deleting list:', error);
              Alert.alert('Error', 'Failed to delete the list. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#4158D0', '#C850C0', '#FFCC70']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.maxWidthContainer}>
          <ThemedView style={styles.container}>
            <Animated.View
              style={styles.headerContainer}
              entering={FadeIn}
            >
              <ThemedText style={styles.logoText}>Taskly</ThemedText>
              <ThemedText style={styles.tagline}>Organize your tasks</ThemedText>
            </Animated.View>

            <ThemedView style={styles.progressCard}>
              <ThemedText style={styles.progressTitle}>Overall Progress</ThemedText>
              <View style={styles.progressBarContainer}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    { width: `${overallProgress.percentage}%` },
                    { backgroundColor: '#4158D0' }
                  ]}
                />
              </View>
              <ThemedText style={styles.progressText}>
                {overallProgress.completedTasks} of {overallProgress.totalTasks} tasks completed
                {overallProgress.totalTasks > 0 && overallProgress.completedTasks === overallProgress.totalTasks && (
                  <ThemedText style={styles.completedTag}> • All Done! 🎉</ThemedText>
                )}
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.inputCard}>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, { color: Colors[colorScheme].text }]}
                  value={newListTitle}
                  onChangeText={setNewListTitle}
                  placeholder="Create a new task list..."
                  placeholderTextColor="rgba(0,0,0,0.5)"
                  onSubmitEditing={handleAddList}
                />
                <Pressable
                  onPress={handleAddList}
                  style={[styles.addButton, { backgroundColor: '#4158D0' }]}
                >
                  <Ionicons name="add-outline" size={24} color="white" />
                </Pressable>
              </View>
            </ThemedView>

            <FlatList
              data={taskLists}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Animated.View
                  entering={FadeIn}
                  exiting={FadeOut}
                  layout={Layout.springify()}
                >
                  <View style={[
                    styles.taskListItem,
                    { borderLeftColor: item.color },
                    item.totalTasks > 0 && item.completedTasks === item.totalTasks && styles.completedListItem
                  ]}>
                    {item.totalTasks > 0 && item.completedTasks === item.totalTasks && (
                      <View style={styles.completedBadge}>
                        <ThemedText style={styles.completedBadgeText}>Done</ThemedText>
                      </View>
                    )}
                    <View style={styles.taskListContent}>
                      <View style={styles.taskListHeader}>
                        <Link href={`/task-details/${item.id}`} asChild>
                          <Pressable>
                            <ThemedText style={styles.taskListTitle}>{item.title}</ThemedText>
                          </Pressable>
                        </Link>
                        <Pressable
                          onPress={() => {
                            if (Platform.OS === 'web') {
                              if (window.confirm(`Are you sure you want to delete "${item.title}" and all its tasks?`)) {
                                deleteTaskList(item.id);
                              }
                            } else {
                              Alert.alert(
                                'Delete List',
                                `Are you sure you want to delete "${item.title}" and all its tasks?`,
                                [
                                  {
                                    text: 'Cancel',
                                    style: 'cancel',
                                  },
                                  {
                                    text: 'Delete',
                                    style: 'destructive',
                                    onPress: () => deleteTaskList(item.id),
                                  },
                                ],
                              );
                            }
                          }}
                          style={styles.deleteButton}
                        >
                          <Ionicons name="trash-outline" size={20} color="rgba(0,0,0,0.5)" />
                        </Pressable>
                      </View>
                      <ThemedText style={styles.taskListSubtitle}>
                        {item.completedTasks} of {item.totalTasks} tasks completed
                      </ThemedText>
                    </View>
                    <View style={styles.taskListProgress}>
                      <ThemedView style={styles.progressBarContainer}>
                        <Animated.View
                          style={[
                            styles.progressBar,
                            {
                              width: item.totalTasks > 0
                                ? `${(item.completedTasks / item.totalTasks) * 100}%`
                                : '0%',
                              backgroundColor: item.color
                            }
                          ]}
                        />
                      </ThemedView>
                    </View>
                  </View>
                </Animated.View>
              )}
              style={styles.list}
              showsVerticalScrollIndicator={false}
            />
          </ThemedView>
        </View>
      </LinearGradient>
    </SafeAreaView>
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
    width: '100%',
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
  taskListItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    marginBottom: 10,
    padding: 16,
    borderLeftWidth: 4,
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
  taskListContent: {
    marginBottom: 12,
  },
  taskListTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskListSubtitle: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.6)',
  },
  taskListProgress: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
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
    width: Platform.select({
      web: progress => `${Math.min(progress, 100)}%`,
      default: progress => Math.min(progress, 100) + '%',
    }),
  },
  maxWidthContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 768,
    alignSelf: 'center',
    ...Platform.select({
      web: {
        marginHorizontal: 'auto',
      },
    }),
  },
  taskListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  deleteButton: {
    padding: 8,
    marginRight: -8,
    marginLeft: 8,
  },
  progressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
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
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.6)',
  },
  completedTag: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  completedListItem: {
    borderColor: '#4CAF50',
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  completedBadge: {
    position: 'absolute',
    top: 12,
    right: 44,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
