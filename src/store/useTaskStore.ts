import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Task, Priority, Column, ColumnId, ProjectId, AssigneeId } from '../types/task';
import { WORKSPACE_PROJECTS, WORKSPACE_ASSIGNEES } from '../data/workspace';

const normalizeTask = (task: Task): Task => ({
  ...task,
  subtasks: task.subtasks ?? [],
  comments: task.comments ?? [],
  activity: task.activity ?? []
});

interface TaskState {
  tasks: Record<string, Task>;
  columns: Record<string, Column>;
  columnOrder: ColumnId[];
  
  // Actions
  addTask: (
    columnId: ColumnId,
    title: string,
    description: string,
    priority: Priority,
    assignee: AssigneeId | undefined,
    dueDate: string | undefined,
    projectId: ProjectId
  ) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string, columnId: ColumnId) => void;
  duplicateTask: (taskId: string) => void;
  moveTask: (
    sourceColumnId: ColumnId,
    destinationColumnId: ColumnId,
    sourceIndex: number,
    destinationIndex: number,
    taskId: string
  ) => void;
  reorderColumn: (columnId: ColumnId, startIndex: number, endIndex: number) => void;
  addColumn: (title: string) => ColumnId;
  renameColumn: (columnId: ColumnId, title: string) => void;
  deleteColumn: (columnId: ColumnId) => void;
}

const defaultProjectId = WORKSPACE_PROJECTS[0]?.id ?? 'roadmap';
const defaultAssignee = WORKSPACE_ASSIGNEES[0] ?? 'You';

const initialTasks: Record<string, Task> = {
  'task-1': {
    id: 'task-1',
    title: 'Design System Architecture',
    description: 'Define the core components and design tokens for the new project.',
    status: 'todo',
    priority: 'high',
    createdAt: Date.now(),
    tags: ['design', 'core'],
    projectId: defaultProjectId,
    assignee: defaultAssignee,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    subtasks: [
      { id: 'subtask-1', title: 'Audit token naming', completed: true },
      { id: 'subtask-2', title: 'Document spacing scale', completed: false },
      { id: 'subtask-3', title: 'Review component ownership', completed: false }
    ],
    comments: [
      {
        id: 'comment-1',
        author: 'Sarah Kim',
        content: 'Let us make sure the spacing tokens match the design handoff before implementation starts.',
        createdAt: Date.now() - 1000 * 60 * 60 * 6
      }
    ],
    activity: [
      {
        id: 'activity-1',
        text: 'Task created in To Do',
        createdAt: Date.now() - 1000 * 60 * 60 * 24
      },
      {
        id: 'activity-2',
        text: 'Design checklist added',
        createdAt: Date.now() - 1000 * 60 * 60 * 12
      }
    ]
  },
  'task-2': {
    id: 'task-2',
    title: 'Implement Auth Flow',
    description: 'Set up Firebase authentication and protected routes.',
    status: 'in-progress',
    priority: 'medium',
    createdAt: Date.now(),
    tags: ['auth', 'backend'],
    projectId: defaultProjectId,
    assignee: WORKSPACE_ASSIGNEES[1],
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    subtasks: [
      { id: 'subtask-4', title: 'Set up route guards', completed: true },
      { id: 'subtask-5', title: 'Connect sign-in screen', completed: false }
    ],
    comments: [
      {
        id: 'comment-2',
        author: 'Daniel Ruiz',
        content: 'Once auth is stable, we can thread the protected routes into onboarding.',
        createdAt: Date.now() - 1000 * 60 * 45
      }
    ],
    activity: [
      {
        id: 'activity-3',
        text: 'Task created in In Progress',
        createdAt: Date.now() - 1000 * 60 * 60 * 18
      }
    ]
  }
};

const initialColumns: Record<string, Column> = {
  'todo': { id: 'todo', title: 'To Do', taskIds: ['task-1'] },
  'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: ['task-2'] },
  'review': { id: 'review', title: 'Review', taskIds: [] },
  'done': { id: 'done', title: 'Done', taskIds: [] }
};

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: initialTasks,
      columns: initialColumns,
      columnOrder: ['todo', 'in-progress', 'review', 'done'],

      addTask: (columnId, title, description, priority, assignee, dueDate, projectId) => {
        const id = uuidv4();
        const newTask: Task = {
          id,
          title,
          description,
          status: columnId,
          priority,
          createdAt: Date.now(),
          tags: [],
          projectId,
          assignee,
          dueDate: dueDate || undefined,
          subtasks: [],
          comments: [],
          activity: [
            {
              id: uuidv4(),
              text: `Task created in ${columnId}`,
              createdAt: Date.now()
            }
          ]
        };

        set((state) => ({
          tasks: { ...state.tasks, [id]: newTask },
          columns: {
            ...state.columns,
            [columnId]: {
              ...state.columns[columnId],
              taskIds: [...state.columns[columnId].taskIds, id]
            }
          }
        }));
      },

      updateTask: (taskId, updates) => {
        set((state) => {
          const existingTask = state.tasks[taskId];
          if (!existingTask) return state;

          const nextStatus = updates.status ?? existingTask.status;

          if (nextStatus === existingTask.status) {
            return {
              tasks: {
                ...state.tasks,
                [taskId]: { ...existingTask, ...updates, status: nextStatus }
              }
            };
          }

          const sourceColumn = state.columns[existingTask.status];
          const destinationColumn = state.columns[nextStatus];

          if (!sourceColumn || !destinationColumn) return state;

          return {
            tasks: {
              ...state.tasks,
              [taskId]: { ...existingTask, ...updates, status: nextStatus }
            },
            columns: {
              ...state.columns,
              [existingTask.status]: {
                ...sourceColumn,
                taskIds: sourceColumn.taskIds.filter((id) => id !== taskId)
              },
              [nextStatus]: {
                ...destinationColumn,
                taskIds: [...destinationColumn.taskIds, taskId]
              }
            }
          };
        });
      },

      deleteTask: (taskId, columnId) => {
        set((state) => {
          const newTasks = { ...state.tasks };
          delete newTasks[taskId];
          
          return {
            tasks: newTasks,
            columns: {
              ...state.columns,
              [columnId]: {
                ...state.columns[columnId],
                taskIds: state.columns[columnId].taskIds.filter(id => id !== taskId)
              }
            }
          };
        });
      },

      duplicateTask: (taskId) => {
        set((state) => {
          const existingTask = state.tasks[taskId];
          if (!existingTask) return state;

          const newTaskId = uuidv4();
          const duplicatedTask: Task = {
            ...existingTask,
            id: newTaskId,
            title: `${existingTask.title} (Copy)`,
            createdAt: Date.now(),
            subtasks: existingTask.subtasks.map((subtask) => ({
              ...subtask,
              id: uuidv4()
            }))
          };

          const column = state.columns[existingTask.status];
          if (!column) return state;

          const insertionIndex = column.taskIds.indexOf(taskId) + 1;
          const nextTaskIds = [...column.taskIds];
          nextTaskIds.splice(insertionIndex, 0, newTaskId);

          return {
            tasks: {
              ...state.tasks,
              [newTaskId]: duplicatedTask
            },
            columns: {
              ...state.columns,
              [existingTask.status]: {
                ...column,
                taskIds: nextTaskIds
              }
            }
          };
        });
      },

      moveTask: (sourceColId, destColId, sourceIdx, destIdx, taskId) => {
        set((state) => {
          const sourceCol = state.columns[sourceColId];
          const destCol = state.columns[destColId];
          
          const newSourceTaskIds = Array.from(sourceCol.taskIds);
          newSourceTaskIds.splice(sourceIdx, 1);
          
          const newDestTaskIds = Array.from(destCol.taskIds);
          newDestTaskIds.splice(destIdx, 0, taskId);
          
          return {
            tasks: {
              ...state.tasks,
              [taskId]: { ...state.tasks[taskId], status: destColId }
            },
            columns: {
              ...state.columns,
              [sourceColId]: { ...sourceCol, taskIds: newSourceTaskIds },
              [destColId]: { ...destCol, taskIds: newDestTaskIds }
            }
          };
        });
      },

      reorderColumn: (columnId, startIdx, endIdx) => {
        set((state) => {
          const column = state.columns[columnId];
          const newTaskIds = Array.from(column.taskIds);
          const [removed] = newTaskIds.splice(startIdx, 1);
          newTaskIds.splice(endIdx, 0, removed);
          
          return {
            columns: {
              ...state.columns,
              [columnId]: { ...column, taskIds: newTaskIds }
            }
          };
        });
      },

      addColumn: (title) => {
        const id = `col-${uuidv4().slice(0, 8)}`;

        set((state) => ({
          columns: {
            ...state.columns,
            [id]: { id, title, taskIds: [] }
          },
          columnOrder: [...state.columnOrder, id]
        }));

        return id;
      },

      renameColumn: (columnId, title) => {
        set((state) => {
          if (!state.columns[columnId]) return state;

          return {
            columns: {
              ...state.columns,
              [columnId]: { ...state.columns[columnId], title }
            }
          };
        });
      },

      deleteColumn: (columnId) => {
        set((state) => {
          if (!state.columns[columnId] || state.columnOrder.length <= 1) return state;

          const remainingOrder = state.columnOrder.filter((id) => id !== columnId);
          const fallbackColumnId = remainingOrder[0];
          const removedTaskIds = state.columns[columnId].taskIds;

          const newColumns = { ...state.columns };
          delete newColumns[columnId];

          const newTasks = { ...state.tasks };

          if (fallbackColumnId) {
            removedTaskIds.forEach((taskId) => {
              if (newTasks[taskId]) {
                newTasks[taskId] = { ...newTasks[taskId], status: fallbackColumnId };
              }
            });

            const fallbackColumn = newColumns[fallbackColumnId];
            newColumns[fallbackColumnId] = {
              ...fallbackColumn,
              taskIds: [...fallbackColumn.taskIds, ...removedTaskIds]
            };
          } else {
            removedTaskIds.forEach((taskId) => {
              delete newTasks[taskId];
            });
          }

          return {
            tasks: newTasks,
            columns: newColumns,
            columnOrder: remainingOrder
          };
        });
      }
    }),
    {
      name: 'taskflow-storage',
      merge: (persistedState, currentState) => {
        const typedPersistedState = persistedState as Partial<TaskState> | undefined;
        const persistedTasks = typedPersistedState?.tasks ?? {};

        return {
          ...currentState,
          ...typedPersistedState,
          tasks: Object.fromEntries(
            Object.entries({ ...currentState.tasks, ...persistedTasks }).map(([taskId, task]) => [
              taskId,
              normalizeTask(task as Task)
            ])
          )
        };
      }
    }
  )
);
