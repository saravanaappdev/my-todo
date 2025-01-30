import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TaskList {
    id: string;
    title: string;
    totalTasks: number;
    completedTasks: number;
    color: string;
}

interface Task {
    id: string;
    title: string;
    completed: boolean;
    category: Category;
    listId: string;
}

interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
}

interface ProgressStats {
    totalTasks: number;
    completedTasks: number;
    percentage: number;
}

interface TaskContextType {
    taskLists: TaskList[];
    tasks: { [listId: string]: Task[] };
    addTaskList: (title: string) => Promise<void>;
    deleteTaskList: (id: string) => Promise<void>;
    addTask: (listId: string, task: Omit<Task, 'id'>) => Promise<void>;
    toggleTask: (listId: string, taskId: string) => Promise<void>;
    deleteTask: (listId: string, taskId: string) => Promise<void>;
    getOverallProgress: () => ProgressStats;
    getListProgress: (listId: string) => ProgressStats;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const COLORS = [
    '#4158D0',
    '#C850C0',
    '#FF6B6B',
    '#4CAF50',
    '#FF9800',
];

export function TaskProvider({ children }: { children: React.ReactNode }) {
    const [taskLists, setTaskLists] = useState<TaskList[]>([]);
    const [tasks, setTasks] = useState<{ [listId: string]: Task[] }>({});

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const storedLists = await AsyncStorage.getItem('taskLists');
            const storedTasks = await AsyncStorage.getItem('tasks');

            if (storedLists) setTaskLists(JSON.parse(storedLists));
            if (storedTasks) setTasks(JSON.parse(storedTasks));
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    async function saveData(lists: TaskList[], tasksData: { [listId: string]: Task[] }) {
        try {
            await AsyncStorage.setItem('taskLists', JSON.stringify(lists));
            await AsyncStorage.setItem('tasks', JSON.stringify(tasksData));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    async function addTaskList(title: string) {
        const newList: TaskList = {
            id: Date.now().toString(),
            title,
            totalTasks: 0,
            completedTasks: 0,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
        };

        const updatedLists = [...taskLists, newList];
        setTaskLists(updatedLists);
        setTasks({ ...tasks, [newList.id]: [] });
        await saveData(updatedLists, tasks);
    }

    async function deleteTaskList(id: string) {
        try {
            const updatedLists = taskLists.filter(list => list.id !== id);
            const updatedTasks = { ...tasks };
            delete updatedTasks[id];

            setTaskLists(updatedLists);
            setTasks(updatedTasks);
            await saveData(updatedLists, updatedTasks);
        } catch (error) {
            console.error('Error deleting task list:', error);
            throw error;
        }
    }

    async function addTask(listId: string, task: Omit<Task, 'id'>) {
        const newTask: Task = {
            ...task,
            id: Date.now().toString(),
            listId,
        };

        const updatedTasks = {
            ...tasks,
            [listId]: [...(tasks[listId] || []), newTask],
        };

        const updatedLists = taskLists.map(list => {
            if (list.id === listId) {
                return {
                    ...list,
                    totalTasks: list.totalTasks + 1,
                };
            }
            return list;
        });

        setTasks(updatedTasks);
        setTaskLists(updatedLists);
        await saveData(updatedLists, updatedTasks);
    }

    async function toggleTask(listId: string, taskId: string) {
        const updatedTasks = {
            ...tasks,
            [listId]: tasks[listId].map(task => {
                if (task.id === taskId) {
                    return { ...task, completed: !task.completed };
                }
                return task;
            }),
        };

        const listTasks = updatedTasks[listId];
        const completedCount = listTasks.filter(t => t.completed).length;

        const updatedLists = taskLists.map(list => {
            if (list.id === listId) {
                return {
                    ...list,
                    totalTasks: listTasks.length,
                    completedTasks: completedCount,
                };
            }
            return list;
        });

        setTasks(updatedTasks);
        setTaskLists(updatedLists);
        await saveData(updatedLists, updatedTasks);
    }

    async function deleteTask(listId: string, taskId: string) {
        try {
            const taskToDelete = tasks[listId]?.find(t => t.id === taskId);
            if (!taskToDelete) return;

            const updatedTasks = {
                ...tasks,
                [listId]: tasks[listId].filter(task => task.id !== taskId),
            };

            const updatedLists = taskLists.map(list => {
                if (list.id === listId) {
                    const remainingTasks = updatedTasks[listId];
                    return {
                        ...list,
                        totalTasks: remainingTasks.length,
                        completedTasks: remainingTasks.filter(t => t.completed).length,
                    };
                }
                return list;
            });

            setTasks(updatedTasks);
            setTaskLists(updatedLists);
            await saveData(updatedLists, updatedTasks);
        } catch (error) {
            console.error('Error deleting task:', error);
            throw error;
        }
    }

    function getOverallProgress(): ProgressStats {
        const allTasks = Object.values(tasks).flat();
        const total = allTasks.length;
        const completed = allTasks.filter(task => task.completed).length;
        return {
            totalTasks: total,
            completedTasks: completed,
            percentage: total > 0 ? (completed / total) * 100 : 0
        };
    }

    function getListProgress(listId: string): ProgressStats {
        const listTasks = tasks[listId] || [];
        const total = listTasks.length;
        const completed = listTasks.filter(task => task.completed).length;
        return {
            totalTasks: total,
            completedTasks: completed,
            percentage: total > 0 ? (completed / total) * 100 : 0
        };
    }

    return (
        <TaskContext.Provider
            value={{
                taskLists,
                tasks,
                addTaskList,
                deleteTaskList,
                addTask,
                toggleTask,
                deleteTask,
                getOverallProgress,
                getListProgress,
            }}
        >
            {children}
        </TaskContext.Provider>
    );
}

export function useTaskContext() {
    const context = useContext(TaskContext);
    if (context === undefined) {
        throw new Error('useTaskContext must be used within a TaskProvider');
    }
    return context;
} 