import React, { useEffect, useRef, useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useTaskStore } from '../store/useTaskStore';
import { Column } from './Column';
import { AddTaskModal } from './AddTaskModal';
import { ColumnModal } from './ColumnModal';
import { ConfirmModal } from './ConfirmModal';
import { TaskDetailsDrawer } from './TaskDetailsDrawer';
import { TaskListView } from './TaskListView';
import { WorkspaceOverview } from './WorkspaceOverview';
import { Priority, Task } from '../types/task';
import { WORKSPACE_PROJECTS, WORKSPACE_ASSIGNEES } from '../data/workspace';
import { 
  ChevronLeft,
  ChevronRight,
  Search, 
  Filter,
  LayoutGrid, 
  List, 
  Plus, 
  Bell, 
  Settings,
  ChevronDown,
  Sparkles,
  SunMedium,
  MoonStar
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import type { ThemeMode } from '../App';

interface KanbanBoardProps {
  onOpenAssistant?: () => void;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
}

type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  read: boolean;
};

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'my-tasks', label: 'My Tasks' },
  { id: 'projects', label: 'Projects' },
  { id: 'team', label: 'Team' }
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'note-1',
    title: 'Design review complete',
    detail: 'UI check-in approved by Sarah.',
    time: '2h ago',
    read: false
  },
  {
    id: 'note-2',
    title: 'New task assigned',
    detail: 'Implement onboarding tooltip set.',
    time: '4h ago',
    read: false
  },
  {
    id: 'note-3',
    title: 'Sprint planning',
    detail: 'Team planning session tomorrow at 10 AM.',
    time: 'Yesterday',
    read: true
  }
];

export const KanbanBoard = ({ onOpenAssistant, themeMode, onToggleTheme }: KanbanBoardProps) => {
  const { 
    tasks, 
    columns, 
    columnOrder, 
    moveTask, 
    reorderColumn,
    addColumn,
    renameColumn,
    deleteColumn,
    updateTask,
    duplicateTask,
    deleteTask
  } = useTaskStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activePriorities, setActivePriorities] = useState<Priority[]>([]);
  const [activeNav, setActiveNav] = useState(NAV_ITEMS[0].id);
  const [activeProjectId, setActiveProjectId] = useState(WORKSPACE_PROJECTS[0]?.id ?? 'roadmap');
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [columnModalMode, setColumnModalMode] = useState<'create' | 'rename'>('create');
  const [columnDraft, setColumnDraft] = useState('');
  const [activeManageColumnId, setActiveManageColumnId] = useState<string | null>(null);
  const [confirmationState, setConfirmationState] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    action: () => void;
  } | null>(null);
  const [mobileActiveColumnId, setMobileActiveColumnId] = useState<string | null>(null);
  const [collapsedColumnIds, setCollapsedColumnIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];

    try {
      const storedValue = window.localStorage.getItem('taskflow-collapsed-columns');
      return storedValue ? JSON.parse(storedValue) : [];
    } catch {
      return [];
    }
  });

  const filterRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const desktopSearchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const mobileColumnRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const activeNavItem = NAV_ITEMS.find((item) => item.id === activeNav) ?? NAV_ITEMS[0];
  const activeProject = WORKSPACE_PROJECTS.find((project) => project.id === activeProjectId) ?? WORKSPACE_PROJECTS[0];
  const selectedTask = selectedTaskId ? tasks[selectedTaskId] ?? null : null;
  const unreadNotifications = notifications.filter((item) => !item.read).length;
  const primaryAssignee = WORKSPACE_ASSIGNEES[0] ?? 'You';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (isFilterOpen && filterRef.current && !filterRef.current.contains(target)) {
        setIsFilterOpen(false);
      }

      if (isProjectMenuOpen && projectRef.current && !projectRef.current.contains(target)) {
        setIsProjectMenuOpen(false);
      }

      if (isNotificationsOpen && notificationsRef.current && !notificationsRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }

      if (isSettingsOpen && settingsRef.current && !settingsRef.current.contains(target)) {
        setIsSettingsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsFilterOpen(false);
      setIsProjectMenuOpen(false);
      setIsNotificationsOpen(false);
      setIsSettingsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFilterOpen, isProjectMenuOpen, isNotificationsOpen, isSettingsOpen]);

  useEffect(() => {
    window.localStorage.setItem('taskflow-collapsed-columns', JSON.stringify(collapsedColumnIds));
  }, [collapsedColumnIds]);

  useEffect(() => {
    if (!columnOrder.length) {
      setMobileActiveColumnId(null);
      return;
    }

    if (!mobileActiveColumnId || !columnOrder.includes(mobileActiveColumnId)) {
      setMobileActiveColumnId(columnOrder[0]);
    }
  }, [columnOrder, mobileActiveColumnId]);

  useEffect(() => {
    const handleKeyboardShortcuts = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (event.key === '/' && !isTyping) {
        event.preventDefault();
        desktopSearchRef.current?.focus();
        mobileSearchRef.current?.focus();
        return;
      }

      if (isTyping) return;

      if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        openTaskModal();
      }

      if (event.key.toLowerCase() === 'b') {
        event.preventDefault();
        setViewMode('board');
      }

      if (event.key.toLowerCase() === 'l') {
        event.preventDefault();
        setViewMode('list');
      }

      if (event.key.toLowerCase() === 'a' && event.shiftKey && onOpenAssistant) {
        event.preventDefault();
        onOpenAssistant();
      }
    };

    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [onOpenAssistant]);

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (source.droppableId === destination.droppableId) {
      reorderColumn(source.droppableId, source.index, destination.index);
    } else {
      moveTask(
        source.droppableId,
        destination.droppableId,
        source.index,
        destination.index,
        draggableId
      );
    }
  };

  const closeAllMenus = () => {
    setIsFilterOpen(false);
    setIsProjectMenuOpen(false);
    setIsNotificationsOpen(false);
    setIsSettingsOpen(false);
  };

  const toggleFilterMenu = () => {
    setIsFilterOpen((prev) => !prev);
    setIsProjectMenuOpen(false);
    setIsNotificationsOpen(false);
    setIsSettingsOpen(false);
  };

  const toggleProjectMenu = () => {
    setIsProjectMenuOpen((prev) => !prev);
    setIsFilterOpen(false);
    setIsNotificationsOpen(false);
    setIsSettingsOpen(false);
  };

  const toggleNotificationsMenu = () => {
    setIsNotificationsOpen((prev) => !prev);
    setIsFilterOpen(false);
    setIsProjectMenuOpen(false);
    setIsSettingsOpen(false);
  };

  const toggleSettingsMenu = () => {
    setIsSettingsOpen((prev) => !prev);
    setIsFilterOpen(false);
    setIsProjectMenuOpen(false);
    setIsNotificationsOpen(false);
  };

  const openTaskModal = (columnId?: string) => {
    setEditingTask(null);
    setActiveColumnId(columnId ?? columnOrder[0] ?? null);
    setIsModalOpen(true);
    closeAllMenus();
  };

  const openEditTaskModal = (task: Task) => {
    setSelectedTaskId(null);
    setEditingTask(task);
    setActiveColumnId(task.status);
    setIsModalOpen(true);
    closeAllMenus();
  };

  const openTaskDetails = (task: Task) => {
    setSelectedTaskId(task.id);
    closeAllMenus();
  };

  const normalizedQuery = searchQuery.toLowerCase().trim();
  const matchesSearch = (title: string, description: string) => {
    if (!normalizedQuery) return true;
    return (
      title.toLowerCase().includes(normalizedQuery) ||
      description.toLowerCase().includes(normalizedQuery)
    );
  };

  const matchesPriority = (priority: Priority) => {
    if (activePriorities.length === 0) return true;
    return activePriorities.includes(priority);
  };

  const matchesProject = (projectId?: string) => {
    if (!projectId) return true;
    return projectId === activeProjectId;
  };

  const matchesNav = (assignee?: string) => {
    if (activeNav === 'my-tasks') {
      return assignee === primaryAssignee;
    }

    if (activeNav === 'team') {
      return Boolean(assignee && assignee !== primaryAssignee);
    }

    return true;
  };

  const matchesFilters = (title: string, description: string, priority: Priority, projectId?: string, assignee?: string) => {
    return (
      matchesSearch(title, description) &&
      matchesPriority(priority) &&
      matchesProject(projectId) &&
      matchesNav(assignee)
    );
  };

  const listTasks = columnOrder.flatMap((columnId) =>
    columns[columnId].taskIds
      .map((taskId) => tasks[taskId])
      .filter((task) => matchesFilters(task.title, task.description, task.priority, task.projectId, task.assignee))
  );

  const togglePriority = (priority: Priority) => {
    setActivePriorities((prev) =>
      prev.includes(priority)
        ? prev.filter((item) => item !== priority)
        : [...prev, priority]
    );
  };

  const handleAddColumn = () => {
    setColumnModalMode('create');
    setColumnDraft('');
    setActiveManageColumnId(null);
    setIsColumnModalOpen(true);
    closeAllMenus();
  };

  const handleRenameColumn = (columnId: string) => {
    const currentTitle = columns[columnId]?.title ?? 'Column';
    setColumnModalMode('rename');
    setColumnDraft(currentTitle);
    setActiveManageColumnId(columnId);
    setIsColumnModalOpen(true);
    closeAllMenus();
  };

  const handleColumnModalSubmit = (title: string) => {
    if (columnModalMode === 'create') {
      addColumn(title);
      return;
    }

    if (activeManageColumnId) {
      renameColumn(activeManageColumnId, title);
    }
  };

  const toggleColumnCollapse = (columnId: string) => {
    setCollapsedColumnIds((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleDeleteColumn = (columnId: string) => {
    const column = columns[columnId];
    if (!column) return;

    const remaining = columnOrder.filter((id) => id !== columnId);
    const fallbackTitle = remaining.length > 0 ? columns[remaining[0]]?.title : '';
    const confirmationMessage = remaining.length > 0
      ? `Delete "${column.title}"? Tasks will move to "${fallbackTitle}".`
      : `Delete "${column.title}"? This will remove all tasks in the column.`;

    setConfirmationState({
      title: `Delete ${column.title}?`,
      description: confirmationMessage,
      confirmLabel: 'Delete column',
      action: () => {
        deleteColumn(columnId);
        setConfirmationState(null);
      }
    });
  };

  const handleDeleteTask = (task: Task) => {
    setConfirmationState({
      title: `Delete ${task.title}?`,
      description: 'This task will be removed from the board. You can duplicate it first if you want to keep a copy.',
      confirmLabel: 'Delete task',
      action: () => {
        deleteTask(task.id, task.status);
        if (selectedTaskId === task.id) {
          setSelectedTaskId(null);
        }
        setConfirmationState(null);
      }
    });
  };

  const handleDuplicateTask = (task: Task) => {
    duplicateTask(task.id);
  };

  const handleMarkTaskDone = (task: Task) => {
    const doneColumnId = columnOrder.find((columnId) => columns[columnId]?.title.toLowerCase() === 'done') ?? 'done';
    updateTask(task.id, {
      status: doneColumnId,
      activity: [
        ...task.activity,
        {
          id: crypto.randomUUID(),
          text: `Moved task to ${columns[doneColumnId]?.title ?? 'Done'}`,
          createdAt: Date.now()
        }
      ]
    });
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    updateTask(taskId, updates);
  };

  const handleAddComment = (task: Task, content: string) => {
    updateTask(task.id, {
      comments: [
        ...task.comments,
        {
          id: crypto.randomUUID(),
          author: primaryAssignee,
          content,
          createdAt: Date.now()
        }
      ],
      activity: [
        ...task.activity,
        {
          id: crypto.randomUUID(),
          text: 'Added a new comment',
          createdAt: Date.now()
        }
      ]
    });
  };

  const handleProjectSelect = (projectId: string) => {
    setActiveProjectId(projectId);
    setIsProjectMenuOpen(false);
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  };

  const handleResetWorkspace = () => {
    setSearchQuery('');
    setActivePriorities([]);
    setViewMode('board');
    setCollapsedColumnIds([]);
    setIsFilterOpen(false);
    setIsProjectMenuOpen(false);
    setIsNotificationsOpen(false);
    setIsSettingsOpen(false);
  };

  const scrollToColumn = (columnId: string) => {
    setMobileActiveColumnId(columnId);
    mobileColumnRefs.current[columnId]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'start',
      block: 'nearest'
    });
  };

  const handleCycleMobileColumn = (direction: 'previous' | 'next') => {
    if (!mobileActiveColumnId) return;
    const currentIndex = columnOrder.indexOf(mobileActiveColumnId);
    if (currentIndex === -1) return;

    const nextIndex =
      direction === 'previous'
        ? Math.max(0, currentIndex - 1)
        : Math.min(columnOrder.length - 1, currentIndex + 1);

    scrollToColumn(columnOrder[nextIndex]);
  };

  const activeFilterCount = activePriorities.length;
  const hasVisibleTasks = listTasks.length > 0;
  const hasActiveFilters = Boolean(searchQuery.trim()) || activePriorities.length > 0 || activeNav !== NAV_ITEMS[0].id;
  const isDashboardView = activeNav === 'dashboard';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex-1 flex flex-col h-full app-surface overflow-hidden"
    >
      {/* Top Navbar */}
      <header className="relative z-40 border-b border-white/10 bg-brand-surface/50 px-4 py-4 backdrop-blur-xl sm:px-8 sm:py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex items-center gap-4 sm:gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg shadow-black/20">
              <div className="w-4 h-4 bg-black rounded-sm" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">TaskFlow</h1>
          </div>
          
          <nav className="hidden min-w-0 items-center gap-1 overflow-x-auto xl:flex">
            {NAV_ITEMS.map((item) => (
              <button 
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-all rounded-lg",
                  activeNav === item.id
                    ? "text-white bg-white/10 shadow-sm"
                    : "text-brand-muted hover:text-white hover:bg-white/5"
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 lg:justify-end">
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
            <input 
              ref={desktopSearchRef}
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-white/30 transition-all w-64"
            />
          </div>
          {onOpenAssistant && (
            <button
              onClick={onOpenAssistant}
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-brand-muted hover:text-white hover:border-white/30 transition-all"
            >
              <Sparkles size={16} />
              Assistant
            </button>
          )}
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-brand-muted transition-all hover:border-white/20 hover:text-white"
          >
            {themeMode === 'aurora' ? <SunMedium size={16} /> : <MoonStar size={16} />}
            <span className="hidden sm:inline">{themeMode === 'aurora' ? 'Daybreak' : 'Aurora'}</span>
          </button>
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={toggleNotificationsMenu}
              className="p-2 hover:bg-white/5 rounded-xl text-brand-muted hover:text-white transition-all relative"
            >
              <Bell size={20} />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-black text-[10px] flex items-center justify-center font-bold">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/10 bg-[color:var(--color-brand-surface)] shadow-[0_24px_60px_rgba(0,0,0,0.45)] z-[80] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <p className="text-sm font-semibold">Notifications</p>
                  {unreadNotifications > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-xs text-brand-muted hover:text-white"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-sm text-brand-muted">You are all caught up.</p>
                  ) : (
                    notifications.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => markNotificationRead(item.id)}
                        className={cn(
                          "w-full text-left px-4 py-3 border-b border-white/5 last:border-none transition-colors",
                          item.read ? "text-brand-muted" : "text-white hover:bg-white/[0.04]"
                        )}
                      >
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="text-xs opacity-70 mt-1">{item.detail}</p>
                        <p className="text-[10px] opacity-50 mt-2">{item.time}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="relative" ref={settingsRef}>
            <button
              onClick={toggleSettingsMenu}
              className="p-2 hover:bg-white/5 rounded-xl text-brand-muted hover:text-white transition-all"
            >
              <Settings size={20} />
            </button>

            {isSettingsOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-brand-surface/90 border border-white/10 rounded-2xl shadow-xl z-[80] overflow-hidden backdrop-blur-xl">
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-sm font-semibold">Workspace</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setIsSettingsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm text-brand-muted hover:text-white hover:bg-white/5"
                  >
                    Clear search
                  </button>
                  <button
                    onClick={() => {
                      setActivePriorities([]);
                      setIsSettingsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm text-brand-muted hover:text-white hover:bg-white/5"
                  >
                    Reset filters
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('board');
                      setIsSettingsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm text-brand-muted hover:text-white hover:bg-white/5"
                  >
                    Reset view
                  </button>
                  <button
                    onClick={handleResetWorkspace}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm text-brand-muted hover:text-white hover:bg-white/5"
                  >
                    Reset workspace
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 border border-white/10 shadow-lg shadow-indigo-500/30" />
        </div>
        </div>
      </header>

      {/* Sub-header */}
      <div className="relative z-20 px-4 py-4 border-b border-white/5 flex flex-col gap-4 bg-brand-surface/40 backdrop-blur-xl sm:px-8 sm:py-6">
        <div>
          <div className="flex items-center gap-3 mb-1 relative" ref={projectRef}>
            <button
              onClick={toggleProjectMenu}
              className="flex items-center gap-2 group"
            >
              <h2 className="text-2xl font-bold tracking-tight">
                {activeProject?.name}
              </h2>
              <ChevronDown
                size={16}
                className={cn(
                  "text-brand-muted transition-transform",
                  isProjectMenuOpen ? "rotate-180" : "rotate-0"
                )}
              />
            </button>
            <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-white/5 border border-white/10 text-brand-muted">
              {activeNavItem.label}
            </span>

            {isProjectMenuOpen && (
              <div className="absolute left-0 top-12 w-64 bg-brand-surface/95 border border-white/10 rounded-2xl shadow-xl p-2 z-30 backdrop-blur-xl">
                {WORKSPACE_PROJECTS.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectSelect(project.id)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-xl transition-all",
                      activeProjectId === project.id
                        ? "bg-white/10 text-white"
                        : "text-brand-muted hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <p className="text-sm font-semibold">{project.name}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {project.description}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-sm text-brand-muted">{activeProject?.description}</p>
          <div className="relative mt-4 lg:hidden">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
            <input
              ref={mobileSearchRef}
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm transition-all focus:border-white/30 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative" ref={filterRef}>
            <button
              onClick={toggleFilterMenu}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-white/10 rounded-xl bg-white/5 text-brand-muted hover:text-white hover:border-white/30 transition-all"
            >
              <Filter size={16} />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 text-[10px] font-bold bg-white text-black px-2 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-[color:var(--color-brand-surface)] shadow-[0_24px_60px_rgba(0,0,0,0.45)] p-3 z-[70]">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-brand-muted mb-2">
                  Priority
                </div>
                <div className="space-y-2">
                  {(['low', 'medium', 'high'] as Priority[]).map((priority) => {
                    const isActive = activePriorities.includes(priority);
                    return (
                      <button
                        key={priority}
                        onClick={() => togglePriority(priority)}
                        className={
                          isActive
                            ? "w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/10 text-white"
                            : "w-full flex items-center justify-between px-3 py-2 rounded-xl text-brand-muted hover:bg-white/5 hover:text-white"
                        }
                      >
                        <span className="text-xs font-medium capitalize">{priority}</span>
                        <span className="text-[10px]">
                          {isActive ? 'On' : 'Off'}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setActivePriorities([])}
                  className="w-full mt-3 text-xs text-brand-muted hover:text-white transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
            <button 
              onClick={() => setViewMode('board')}
              className={
                viewMode === 'board'
                  ? "p-1.5 bg-white/10 text-white rounded-lg shadow-sm"
                  : "p-1.5 text-brand-muted hover:text-white rounded-lg transition-all"
              }
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={
                viewMode === 'list'
                  ? "p-1.5 bg-white/10 text-white rounded-lg shadow-sm"
                  : "p-1.5 text-brand-muted hover:text-white rounded-lg transition-all"
              }
            >
              <List size={18} />
            </button>
          </div>
          <button 
            onClick={() => openTaskModal()}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl text-sm font-bold hover:bg-white/90 transition-all shadow-lg shadow-white/10"
          >
            <Plus size={18} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Board / List */}
      <main className="relative z-0 flex-1 overflow-hidden p-3 sm:p-6">
        <div className="h-full rounded-3xl border border-white/10 bg-white/[0.03] shadow-[0_20px_60px_rgba(0,0,0,0.35)] overflow-hidden">
          {isDashboardView ? (
            <WorkspaceOverview
              tasks={tasks}
              columns={columns}
              columnOrder={columnOrder}
              projects={WORKSPACE_PROJECTS}
              activeProjectId={activeProjectId}
              onAddTask={() => openTaskModal()}
              onOpenTask={openTaskDetails}
            />
          ) : !hasVisibleTasks ? (
            <div className="flex h-full items-center justify-center p-6 sm:p-10">
              <div className="max-w-xl rounded-[28px] border border-white/10 bg-white/[0.04] p-6 text-center shadow-[0_18px_50px_rgba(0,0,0,0.22)] sm:p-10">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <Search size={22} className="text-white/80" />
                </div>
                <h3 className="text-2xl font-semibold tracking-tight">
                  {hasActiveFilters ? 'No tasks match this view' : 'Your board is ready for the next move'}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-brand-muted">
                  {hasActiveFilters
                    ? 'Try clearing search and priority filters, or switch to another team/project lens.'
                    : 'Create your first task to start shaping the workflow for this project.'}
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => openTaskModal()}
                    className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-white/90"
                  >
                    Add task
                  </button>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetWorkspace}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-brand-muted transition-all hover:border-white/20 hover:text-white"
                    >
                      Reset workspace view
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : viewMode === 'board' ? (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="border-b border-white/5 px-4 py-3 md:hidden">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCycleMobileColumn('previous')}
                    disabled={!mobileActiveColumnId || columnOrder.indexOf(mobileActiveColumnId) <= 0}
                    className="rounded-xl border border-white/10 bg-white/5 p-2 text-brand-muted transition-all hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="flex-1 overflow-x-auto">
                    <div className="flex min-w-max gap-2">
                      {columnOrder.map((columnId) => {
                        const isActive = mobileActiveColumnId === columnId;
                        return (
                          <button
                            key={columnId}
                            type="button"
                            onClick={() => scrollToColumn(columnId)}
                            className={cn(
                              'rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-all',
                              isActive
                                ? 'border-white/20 bg-white/12 text-white'
                                : 'border-white/10 bg-white/5 text-brand-muted hover:border-white/20 hover:text-white'
                            )}
                          >
                            {columns[columnId]?.title ?? columnId}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCycleMobileColumn('next')}
                    disabled={!mobileActiveColumnId || columnOrder.indexOf(mobileActiveColumnId) >= columnOrder.length - 1}
                    className="rounded-xl border border-white/10 bg-white/5 p-2 text-brand-muted transition-all hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              <div className="h-full overflow-x-auto overflow-y-hidden p-4 sm:p-6">
                <div className="flex gap-4 sm:gap-8 h-full min-w-max">
                  {columnOrder.map((columnId) => {
                    const column = columns[columnId];
                    const columnTasks = column.taskIds
                      .map((taskId) => tasks[taskId])
                      .filter((task) => matchesFilters(task.title, task.description, task.priority, task.projectId, task.assignee));

                    return (
                      <div
                        key={column.id}
                        ref={(element) => {
                          mobileColumnRefs.current[column.id] = element;
                        }}
                        className={cn(
                          'shrink-0',
                          mobileActiveColumnId && mobileActiveColumnId !== column.id ? 'hidden md:block' : 'block'
                        )}
                      >
                        <Column
                          id={column.id}
                          title={column.title}
                          tasks={columnTasks}
                          onAddTask={() => openTaskModal(column.id)}
                          onEditTask={openEditTaskModal}
                          onOpenTask={openTaskDetails}
                          onDuplicateTask={handleDuplicateTask}
                          onDeleteTask={handleDeleteTask}
                          onMarkTaskDone={handleMarkTaskDone}
                          isCollapsed={collapsedColumnIds.includes(column.id)}
                          onToggleCollapse={toggleColumnCollapse}
                          onRename={handleRenameColumn}
                          onDelete={handleDeleteColumn}
                          canDelete={columnOrder.length > 1}
                        />
                      </div>
                    );
                  })}
                  
                  {/* Add Column Placeholder */}
                  <div className="hidden h-full w-[18.5rem] shrink-0 sm:w-80 md:block">
                    <button
                      onClick={handleAddColumn}
                      className="w-full h-12 border border-dashed border-white/20 rounded-2xl flex items-center justify-center gap-2 text-brand-muted hover:text-white hover:border-white/40 transition-all group"
                    >
                      <Plus size={18} className="group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium">Add Section</span>
                    </button>
                  </div>
                </div>
              </div>
            </DragDropContext>
          ) : (
            <div className="h-full overflow-y-auto p-4 sm:p-6">
              <TaskListView
                tasks={listTasks}
                columns={columns}
                onEditTask={openEditTaskModal}
                onOpenTask={openTaskDetails}
                onUpdateTask={handleTaskUpdate}
              />
            </div>
          )}
        </div>
      </main>

      <AddTaskModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setActiveColumnId(null);
          setEditingTask(null);
        }}
        defaultColumnId={activeColumnId}
        defaultProjectId={activeProjectId}
        taskToEdit={editingTask}
      />
      <ColumnModal
        isOpen={isColumnModalOpen}
        mode={columnModalMode}
        initialValue={columnDraft}
        onClose={() => {
          setIsColumnModalOpen(false);
          setColumnDraft('');
          setActiveManageColumnId(null);
        }}
        onSubmit={handleColumnModalSubmit}
      />
      <TaskDetailsDrawer
        task={selectedTask}
        columnTitle={selectedTask ? columns[selectedTask.status]?.title : undefined}
        onClose={() => setSelectedTaskId(null)}
        onEdit={openEditTaskModal}
        onUpdateTask={handleTaskUpdate}
        onDuplicate={handleDuplicateTask}
        onDelete={handleDeleteTask}
        onMarkDone={handleMarkTaskDone}
        onAddComment={handleAddComment}
      />
      <ConfirmModal
        isOpen={Boolean(confirmationState)}
        title={confirmationState?.title ?? ''}
        description={confirmationState?.description ?? ''}
        confirmLabel={confirmationState?.confirmLabel ?? 'Confirm'}
        tone="danger"
        onClose={() => setConfirmationState(null)}
        onConfirm={() => confirmationState?.action()}
      />
    </motion.div>

  );
};
