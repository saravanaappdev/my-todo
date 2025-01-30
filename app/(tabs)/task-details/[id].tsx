import { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TextInput, Pressable, Platform, View, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTaskContext } from '@/contexts/TaskContext';

const CATEGORIES = [
    { id: 'personal', name: 'Personal', icon: 'person-outline', color: '#4158D0' },
    { id: 'work', name: 'Work', icon: 'briefcase-outline', color: '#C850C0' },
    { id: 'shopping', name: 'Shopping', icon: 'cart-outline', color: '#FF6B6B' },
    { id: 'home', name: 'Home', icon: 'home-outline', color: '#4CAF50' },
    { id: 'health', name: 'Health', icon: 'fitness-outline', color: '#FF9800' },
];

export default function TaskDetailsScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
    const colorScheme = useColorScheme() ?? 'light';
    const { taskLists, tasks, addTask, toggleTask, deleteTask } = useTaskContext();
    const [showCongrats, setShowCongrats] = useState(false);

    const currentList = taskLists.find(list => list.id === id);
    const currentTasks = tasks[id] || [];

    useEffect(() => {
        if (currentList) {
            router.setParams({ title: currentList.title });
        }
    }, [currentList]);

    useEffect(() => {
        if (currentList && currentList.totalTasks > 0 &&
            currentList.totalTasks === currentList.completedTasks) {
            setShowCongrats(true);
        }
    }, [currentList?.completedTasks, currentList?.totalTasks]);

    if (!currentList) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <LinearGradient
                    colors={['#4158D0', '#C850C0', '#FFCC70']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                >
                    <View style={styles.errorContainer}>
                        <ThemedText style={styles.errorText}>Task list not found</ThemedText>
                        <Pressable
                            style={styles.backButton}
                            onPress={() => router.push('/')}
                        >
                            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
                        </Pressable>
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    const handleAddTask = async () => {
        if (!newTaskTitle.trim()) return;
        await addTask(id, {
            title: newTaskTitle.trim(),
            completed: false,
            category: selectedCategory,
            listId: id,
        });
        setNewTaskTitle('');
    };

    const handleDeleteTask = (taskId: string, title: string) => {
        Alert.alert(
            "Delete Task",
            `Are you sure you want to delete "${title}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteTask(id, taskId);
                            const remainingTasks = currentTasks.filter(t => t.id !== taskId);
                            if (remainingTasks.length === 0) {
                                router.push('/');
                            }
                        } catch (error) {
                            console.error('Error deleting task:', error);
                            Alert.alert('Error', 'Failed to delete the task. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const CongratsModal = () => (
        <Modal
            transparent
            visible={showCongrats}
            animationType="fade"
            onRequestClose={() => setShowCongrats(false)}
        >
            <View style={styles.modalOverlay}>
                <Animated.View
                    entering={FadeIn}
                    style={styles.congratsContainer}
                >
                    <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
                    <ThemedText style={styles.congratsTitle}>
                        Congratulations! 🎉
                    </ThemedText>
                    <ThemedText style={styles.congratsText}>
                        You've completed all tasks in this list!
                    </ThemedText>
                    <Pressable
                        style={styles.closeButton}
                        onPress={() => setShowCongrats(false)}
                    >
                        <ThemedText style={styles.closeButtonText}>
                            Close
                        </ThemedText>
                    </Pressable>
                </Animated.View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <CongratsModal />
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
                            <Pressable
                                onPress={() => router.back()}
                                style={styles.backButton}
                            >
                                <View style={styles.backButtonInner}>
                                    <Ionicons name="arrow-back" size={24} color="white" />
                                    <ThemedText style={styles.backButtonText}>Back</ThemedText>
                                </View>
                            </Pressable>
                            <ThemedText style={styles.headerTitle}>{currentList.title}</ThemedText>
                            <ThemedText style={styles.headerSubtitle}>
                                {currentList.completedTasks} of {currentList.totalTasks} tasks completed
                            </ThemedText>
                        </Animated.View>

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
                                    onSubmitEditing={handleAddTask}
                                />
                                <Pressable
                                    onPress={handleAddTask}
                                    style={[styles.addButton, { backgroundColor: selectedCategory.color }]}
                                >
                                    <Ionicons name="add-outline" size={24} color="white" />
                                </Pressable>
                            </View>
                        </ThemedView>

                        <FlatList
                            data={currentTasks}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <Animated.View
                                    entering={FadeIn}
                                    exiting={FadeOut}
                                    layout={Layout.springify()}
                                >
                                    <View style={styles.taskItem}>
                                        <Pressable
                                            style={[
                                                styles.checkbox,
                                                item.completed && [styles.checkboxChecked, { backgroundColor: item.category.color }]
                                            ]}
                                            onPress={() => toggleTask(id, item.id)}
                                        >
                                            {item.completed && (
                                                <Ionicons name="checkmark-outline" size={18} color="white" />
                                            )}
                                        </Pressable>
                                        <View style={styles.taskContent}>
                                            <ThemedText
                                                style={[styles.taskText, item.completed && styles.taskTextCompleted]}
                                            >
                                                {item.title}
                                            </ThemedText>
                                            <View style={styles.taskCategory}>
                                                <Ionicons
                                                    name={item.category.icon}
                                                    size={14}
                                                    color={item.category.color}
                                                    style={{ marginRight: 4 }}
                                                />
                                                <ThemedText style={[styles.categoryText, { color: item.category.color }]}>
                                                    {item.category.name}
                                                </ThemedText>
                                            </View>
                                        </View>
                                        <Pressable
                                            onPress={() => {
                                                if (Platform.OS === 'web') {
                                                    if (window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
                                                        deleteTask(id, item.id).then(() => {
                                                            if (currentTasks.length === 1) {
                                                                router.push('/');
                                                            }
                                                        });
                                                    }
                                                } else {
                                                    Alert.alert(
                                                        'Delete Task',
                                                        `Are you sure you want to delete "${item.title}"?`,
                                                        [
                                                            {
                                                                text: 'Cancel',
                                                                style: 'cancel',
                                                            },
                                                            {
                                                                text: 'Delete',
                                                                style: 'destructive',
                                                                onPress: async () => {
                                                                    try {
                                                                        await deleteTask(id, item.id);
                                                                        if (currentTasks.length === 1) {
                                                                            router.push('/');
                                                                        }
                                                                    } catch (error) {
                                                                        console.error('Error deleting task:', error);
                                                                        if (Platform.OS === 'web') {
                                                                            window.alert('Failed to delete the task. Please try again.');
                                                                        } else {
                                                                            Alert.alert('Error', 'Failed to delete the task. Please try again.');
                                                                        }
                                                                    }
                                                                },
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
    },
    headerContainer: {
        marginBottom: 30,
        backgroundColor: 'transparent',
    },
    backButton: {
        marginBottom: 16,
        marginTop: 4,
    },
    backButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: Platform.select({ ios: '800', android: 'bold' }),
        color: 'white',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'white',
        opacity: 0.9,
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
        borderColor: 'transparent',
    },
    taskContent: {
        flex: 1,
    },
    taskText: {
        fontSize: 16,
        color: 'rgba(0,0,0,0.8)',
        marginBottom: 4,
    },
    taskTextCompleted: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    taskCategory: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryText: {
        fontSize: 12,
    },
    deleteButton: {
        padding: 8,
        marginLeft: 8,
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: 'white',
        marginBottom: 20,
        textAlign: 'center',
    },
    backButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    congratsContainer: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        width: '80%',
        maxWidth: 320,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    congratsTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    congratsText: {
        fontSize: 16,
        color: 'rgba(0,0,0,0.7)',
        textAlign: 'center',
        marginBottom: 24,
    },
    closeButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 8,
    },
    closeButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
}); 