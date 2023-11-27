import React, { useEffect, useMemo, useState } from 'react';
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  formatDistanceToNow,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subDays
} from 'date-fns';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  CheckSquare,
  Download,
  FolderKanban,
  Layers3,
  Plus,
  Share2,
  Sparkles,
  Target,
  TrendingUp,
  Users
} from 'lucide-react';
import { Column, Task } from '../types/task';
import { WorkspaceProject } from '../data/workspace';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

interface WorkspaceOverviewProps {
  tasks: Record<string, Task>;
  columns: Record<string, Column>;
  columnOrder: string[];
  projects: WorkspaceProject[];
  activeProjectId: string;
  onAddTask: () => void;
  onOpenTask: (task: Task) => void;
}

const statCardStyles = [
  'from-cyan-500/20 via-cyan-400/10 to-transparent',
  'from-emerald-500/20 via-emerald-400/10 to-transparent',
  'from-amber-500/20 via-amber-400/10 to-transparent',
  'from-fuchsia-500/20 via-rose-400/10 to-transparent'
];

const getTaskProgress = (task: Task) => {
  const total = task.subtasks.length;
  const completed = task.subtasks.filter((subtask) => subtask.completed).length;

  return {
    total,
    completed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100)
  };
};

const AnimatedNumber = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const duration = 700;
    const startTime = performance.now();

    const tick = (time: number) => {
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{displayValue}{suffix}</>;
};

export const WorkspaceOverview = ({
  tasks,
  columns,
  columnOrder,
  projects,
  activeProjectId,
  onAddTask,
  onOpenTask
}: WorkspaceOverviewProps) => {
  const [timelineOrder, setTimelineOrder] = useState<string[]>([]);
  const [draggedTimelineTaskId, setDraggedTimelineTaskId] = useState<string | null>(null);
  const allTasks = Object.values(tasks).filter((task) => task.projectId === activeProjectId);
  const activeProject = projects.find((project) => project.id === activeProjectId);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((task) => {
    const columnTitle = columns[task.status]?.title?.toLowerCase() ?? '';
    return columnTitle === 'done';
  }).length;
  const inFlightTasks = allTasks.filter((task) => {
    const columnTitle = columns[task.status]?.title?.toLowerCase() ?? '';
    return columnTitle.includes('progress') || columnTitle === 'review';
  }).length;
  const overdueTasks = allTasks.filter((task) => {
    if (!task.dueDate) return false;
    return new Date(task.dueDate).getTime() < Date.now();
  }).length;

  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const recentTrendDays = useMemo(
    () =>
      eachDayOfInterval({
        start: subDays(new Date(), 6),
        end: new Date()
      }),
    []
  );

  const activityTrend = recentTrendDays.map((day) => {
    const count = allTasks.reduce((sum, task) => {
      return sum + task.activity.filter((entry) => isSameDay(entry.createdAt, day)).length;
    }, 0);

    return {
      day,
      count
    };
  });

  const maxTrendCount = Math.max(...activityTrend.map((item) => item.count), 1);

  const tasksDueSoon = allTasks
    .filter((task) => task.dueDate)
    .sort((a, b) => new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime())
    .slice(0, 4);

  const recentActivity = allTasks
    .flatMap((task) =>
      task.activity.map((entry) => ({
        ...entry,
        task
      }))
    )
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6);

  const workload = projects
    .map((project) => {
      const projectTasks = Object.values(tasks).filter((task) => task.projectId === project.id);
      return {
        project,
        count: projectTasks.length,
        completed: projectTasks.filter((task) => {
          const columnTitle = columns[task.status]?.title?.toLowerCase() ?? '';
          return columnTitle === 'done';
        }).length
      };
    })
    .sort((a, b) => b.count - a.count);

  const assigneeLoad = allTasks.reduce<Record<string, number>>((acc, task) => {
    const key = task.assignee ?? 'Unassigned';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const topAssignees = Object.entries(assigneeLoad)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const timelineTasks = allTasks
    .filter((task) => task.dueDate)
    .sort((a, b) => new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime())
    .slice(0, 5);

  useEffect(() => {
    setTimelineOrder((currentOrder) => {
      const incomingIds = timelineTasks.map((task) => task.id);
      if (currentOrder.length === 0) return incomingIds;

      const retained = currentOrder.filter((taskId) => incomingIds.includes(taskId));
      const missing = incomingIds.filter((taskId) => !retained.includes(taskId));
      return [...retained, ...missing];
    });
  }, [timelineTasks]);

  const orderedTimelineTasks = timelineOrder
    .map((taskId) => timelineTasks.find((task) => task.id === taskId))
    .filter((task): task is Task => Boolean(task));

  const calendarStart = startOfWeek(startOfMonth(new Date()), { weekStartsOn: 1 });
  const calendarEnd = addDays(endOfMonth(new Date()), 6);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd }).slice(0, 35);
  const dueTasksByDay = calendarDays.map((day) =>
    allTasks.filter((task) => task.dueDate && isSameDay(new Date(task.dueDate), day))
  );

  const statCards = [
    {
      label: 'Completion rate',
      value: `${completionRate}%`,
      detail: `${completedTasks} of ${totalTasks} tasks done`,
      icon: CheckCircle2
    },
    {
      label: 'In flight',
      value: `${inFlightTasks}`,
      detail: 'Tasks moving through delivery',
      icon: Layers3
    },
    {
      label: 'Due attention',
      value: `${overdueTasks}`,
      detail: overdueTasks > 0 ? 'Overdue tasks need review' : 'No overdue tasks right now',
      icon: AlertTriangle
    },
    {
      label: 'Live projects',
      value: `${projects.length}`,
      detail: `${projects.filter((project) => project.id === activeProjectId).length} highlighted right now`,
      icon: FolderKanban
    }
  ];

  const exportPayload = JSON.stringify(
    {
      project: activeProject?.name ?? activeProjectId,
      exportedAt: new Date().toISOString(),
      stats: {
        totalTasks,
        completedTasks,
        inFlightTasks,
        overdueTasks,
        completionRate
      },
      tasks: allTasks.map((task) => ({
        title: task.title,
        status: columns[task.status]?.title ?? task.status,
        assignee: task.assignee ?? 'Unassigned',
        dueDate: task.dueDate ?? null,
        progress: getTaskProgress(task)
      }))
    },
    null,
    2
  );

  const shareSummary = `TaskFlow dashboard for ${activeProject?.name ?? activeProjectId}
Completion rate: ${completionRate}%
In flight: ${inFlightTasks}
Overdue: ${overdueTasks}
Upcoming deadlines: ${tasksDueSoon.map((task) => task.title).join(', ') || 'None'}`;

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="grid gap-4 xl:grid-cols-[1.5fr_0.95fr]">
        <section className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.22)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-muted">
                <Sparkles size={13} />
                Command Center
              </div>
              <h3 className="mt-4 text-3xl font-semibold tracking-tight">Workspace overview</h3>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-muted">
                See project momentum, delivery pressure, and recent team movement at a glance without leaving the board.
              </p>
            </div>

            <button
              type="button"
              onClick={onAddTask}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition-all hover:bg-white/90"
            >
              <Plus size={16} />
              Add task
            </button>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(shareSummary);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-brand-muted transition-all hover:border-white/20 hover:text-white"
              >
                <Share2 size={16} />
                Share summary
              </button>
              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([exportPayload], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${activeProject?.id ?? 'workspace'}-dashboard.json`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-brand-muted transition-all hover:border-white/20 hover:text-white"
              >
                <Download size={16} />
                Export snapshot
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {statCards.map((card, index) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.label}
                  className={cn(
                    'rounded-[24px] border border-white/10 bg-gradient-to-br p-5',
                    statCardStyles[index % statCardStyles.length]
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
                      {card.label}
                    </p>
                    <Icon size={16} className="text-white/80" />
                  </div>
                  <p className="mt-4 text-3xl font-semibold tracking-tight">
                    <AnimatedNumber value={Number.parseInt(card.value, 10) || 0} suffix={card.value.replace(/[0-9]/g, '')} />
                  </p>
                  <p className="mt-2 text-sm text-brand-muted">{card.detail}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-muted">
                    Delivery pipeline
                  </p>
                  <h4 className="mt-2 text-lg font-semibold tracking-tight">Tasks by stage</h4>
                </div>
                <TrendingUp size={18} className="text-white/75" />
              </div>

              <div className="mt-5 space-y-4">
                {columnOrder.map((columnId) => {
                  const column = columns[columnId];
                  const count = allTasks.filter((task) => task.status === columnId).length;
                  const width = totalTasks === 0 ? 0 : Math.max(10, Math.round((count / totalTasks) * 100));

                  return (
                    <div key={columnId}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span>{column.title}</span>
                        <span className="text-brand-muted">{count} tasks</span>
                      </div>
                      <div className="h-3 rounded-full bg-white/8">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-300 transition-all"
                          style={{ width: `${count === 0 ? 0 : width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-muted">
                      Delivery pulse
                    </p>
                    <h4 className="mt-2 text-lg font-semibold tracking-tight">7-day movement</h4>
                  </div>
                  <BarChart3 size={18} className="text-white/75" />
                </div>

                <div className="mt-6">
                  <div className="flex items-end gap-3">
                    {activityTrend.map((item, index) => (
                      <div key={item.day.toISOString()} className="flex flex-1 flex-col items-center gap-2">
                        <motion.div
                          initial={{ height: 0, opacity: 0.5 }}
                          animate={{ height: `${Math.max(14, (item.count / maxTrendCount) * 120)}px`, opacity: 1 }}
                          transition={{ delay: index * 0.06, duration: 0.35, ease: 'easeOut' }}
                          className="w-full rounded-t-2xl bg-gradient-to-t from-cyan-400 via-sky-300 to-emerald-300"
                        />
                        <div className="text-center">
                          <p className="text-[11px] font-semibold text-white">{item.count}</p>
                          <p className="text-[10px] uppercase tracking-[0.16em] text-brand-muted">
                            {format(item.day, 'EEE')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-muted">
                      Team bandwidth
                    </p>
                    <h4 className="mt-2 text-lg font-semibold tracking-tight">Assignee load</h4>
                  </div>
                  <Users size={18} className="text-white/75" />
                </div>

                <div className="mt-5 space-y-3">
                  {topAssignees.length > 0 ? (
                    topAssignees.map(([assignee, count]) => (
                      <div key={assignee} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <div>
                          <p className="text-sm font-medium">{assignee}</p>
                          <p className="mt-1 text-xs text-brand-muted">
                            {count === 1 ? '1 assigned task' : `${count} assigned tasks`}
                          </p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-white">
                          {count}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-brand-muted">No assignments yet for this project.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-muted">
                  Calendar view
                </p>
                <h4 className="mt-2 text-lg font-semibold tracking-tight">This month at a glance</h4>
              </div>
              <CalendarClock size={18} className="text-white/75" />
            </div>

            <div className="mt-6 grid grid-cols-7 gap-2 text-center text-[11px] uppercase tracking-[0.18em] text-brand-muted">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                const dayTasks = dueTasksByDay[index];
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'min-h-24 rounded-2xl border p-2',
                      isSameMonth(day, new Date())
                        ? 'border-white/10 bg-white/[0.04]'
                        : 'border-white/6 bg-white/[0.02] text-white/40'
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold">{format(day, 'd')}</span>
                      {dayTasks.length > 0 && (
                        <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">
                          {dayTasks.length}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayTasks.slice(0, 2).map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => onOpenTask(task)}
                          className="block w-full truncate rounded-lg bg-white/7 px-2 py-1 text-left text-[10px] text-white/85 transition-all hover:bg-white/12"
                        >
                          {task.title}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-muted">
                  Timeline lane
                </p>
                <h4 className="mt-2 text-lg font-semibold tracking-tight">Upcoming delivery runway</h4>
              </div>
              <Target size={18} className="text-white/75" />
            </div>

            <div className="mt-6 space-y-4">
              {orderedTimelineTasks.length > 0 ? (
                orderedTimelineTasks.map((task, index) => {
                  const progress = getTaskProgress(task);
                  const offset = index * 12;

                  return (
                    <button
                      key={task.id}
                      type="button"
                      draggable
                      onDragStart={() => setDraggedTimelineTaskId(task.id)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => {
                        if (!draggedTimelineTaskId || draggedTimelineTaskId === task.id) return;
                        setTimelineOrder((currentOrder) => {
                          const nextOrder = currentOrder.filter((taskId) => taskId !== draggedTimelineTaskId);
                          const targetIndex = nextOrder.indexOf(task.id);
                          nextOrder.splice(targetIndex, 0, draggedTimelineTaskId);
                          return nextOrder;
                        });
                        setDraggedTimelineTaskId(null);
                      }}
                      onDragEnd={() => setDraggedTimelineTaskId(null)}
                      onClick={() => onOpenTask(task)}
                      className={cn(
                        "relative flex w-full items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-white/20 hover:bg-white/[0.07]",
                        draggedTimelineTaskId === task.id ? 'opacity-60 ring-2 ring-cyan-300/30' : ''
                      )}
                    >
                      <div className="relative flex flex-col items-center">
                        <div className="z-10 h-4 w-4 rounded-full bg-cyan-300 ring-4 ring-cyan-300/15" />
                        {index < timelineTasks.length - 1 && (
                          <div className="mt-1 h-16 w-px bg-gradient-to-b from-cyan-300/70 to-transparent" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{task.title}</p>
                            <p className="mt-1 text-xs text-brand-muted">
                              {task.dueDate ? format(new Date(task.dueDate), 'EEEE, MMM d') : 'No date set'}
                            </p>
                          </div>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-muted">
                            T+{offset}
                          </span>
                        </div>
                        {progress.total > 0 && (
                          <div className="mt-4">
                            <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-brand-muted">
                              <span>Completion</span>
                              <span>{progress.percent}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/8">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300"
                                style={{ width: `${progress.percent}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-brand-muted">Give a few tasks due dates and the timeline will light up here.</p>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-muted">
                  Due soon
                </p>
                <h4 className="mt-2 text-lg font-semibold tracking-tight">Upcoming deadlines</h4>
              </div>
              <CalendarClock size={18} className="text-white/75" />
            </div>

            <div className="mt-5 space-y-3">
              {tasksDueSoon.length > 0 ? (
                tasksDueSoon.map((task) => {
                  const progress = getTaskProgress(task);

                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => onOpenTask(task)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-white/20 hover:bg-white/[0.07]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{task.title}</p>
                          <p className="mt-1 text-xs text-brand-muted">
                            Due {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'soon'}
                          </p>
                        </div>
                        <ArrowRight size={16} className="mt-1 text-brand-muted" />
                      </div>
                      {progress.total > 0 && (
                        <div className="mt-4">
                          <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-brand-muted">
                            <span>Progress</span>
                            <span>{progress.percent}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/8">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300"
                              style={{ width: `${progress.percent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-brand-muted">No due dates are set for this project yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-muted">
                  Recent movement
                </p>
                <h4 className="mt-2 text-lg font-semibold tracking-tight">Activity feed</h4>
              </div>
              <Activity size={18} className="text-white/75" />
            </div>

            <div className="mt-5 space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onOpenTask(entry.task)}
                    className="flex w-full items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-all hover:border-white/20 hover:bg-white/[0.07]"
                  >
                    <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-cyan-300" />
                    <div>
                      <p className="text-sm text-white">{entry.text}</p>
                      <p className="mt-1 text-xs text-brand-muted">
                        {entry.task.title} • {formatDistanceToNow(entry.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-brand-muted">Activity will appear here as the team updates tasks.</p>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-muted">
                  Project mix
                </p>
                <h4 className="mt-2 text-lg font-semibold tracking-tight">Portfolio snapshot</h4>
              </div>
              <FolderKanban size={18} className="text-white/75" />
            </div>

            <div className="mt-5 space-y-3">
              {workload.map((item) => (
                <div key={item.project.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{item.project.name}</p>
                      <p className="mt-1 text-xs text-brand-muted">
                        {item.completed} completed of {item.count} tasks
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold">
                      {item.count}
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="h-2 rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 via-sky-300 to-emerald-300"
                        style={{
                          width: `${item.count === 0 ? 0 : Math.max(12, Math.round((item.completed / item.count) * 100))}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
