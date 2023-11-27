import React, { useEffect, useState } from 'react';
import { Calendar, CheckSquare, Clock3, PencilLine, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { Column, Task } from '../types/task';
import { cn } from '../lib/utils';

interface TaskListViewProps {
  tasks: Task[];
  columns: Record<string, Column>;
  onEditTask?: (task: Task) => void;
  onOpenTask?: (task: Task) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
}

const priorityStyles = {
  low: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
  medium: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
  high: 'border-rose-500/25 bg-rose-500/10 text-rose-300'
} as const;

const getProgress = (task: Task) => {
  const total = task.subtasks.length;
  const completed = task.subtasks.filter((subtask) => subtask.completed).length;

  return {
    total,
    completed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100)
  };
};

export const TaskListView = ({
  tasks,
  columns,
  onEditTask,
  onOpenTask,
  onUpdateTask
}: TaskListViewProps) => {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');

  useEffect(() => {
    if (!editingTaskId) return;
    const activeTask = tasks.find((task) => task.id === editingTaskId);
    if (!activeTask) {
      setEditingTaskId(null);
      setDraftTitle('');
      setDraftDescription('');
    }
  }, [editingTaskId, tasks]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {tasks.map((task) => {
        const progress = getProgress(task);
        const isEditingInline = editingTaskId === task.id;

        return (
          <div
            key={task.id}
            role="button"
            tabIndex={0}
            onClick={() => onOpenTask?.(task)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onOpenTask?.(task);
              }
            }}
            className="group rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-left transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-[0_16px_40px_rgba(0,0,0,0.22)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]',
                      priorityStyles[task.priority]
                    )}
                  >
                    {task.priority}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-muted">
                    {columns[task.status]?.title ?? 'Unknown'}
                  </span>
                </div>
                <div>
                  {isEditingInline ? (
                    <div className="space-y-3" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="text"
                        value={draftTitle}
                        onChange={(event) => setDraftTitle(event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-base font-semibold tracking-tight outline-none transition-all focus:border-white/20"
                      />
                      <textarea
                        value={draftDescription}
                        onChange={(event) => setDraftDescription(event.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed text-brand-muted outline-none transition-all focus:border-white/20"
                      />
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold tracking-tight">{task.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-brand-muted">
                        {task.description}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {isEditingInline ? (
                <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTaskId(null);
                      setDraftTitle('');
                      setDraftDescription('');
                    }}
                    className="rounded-xl border border-white/10 bg-white/5 p-2 text-brand-muted transition-all hover:border-white/20 hover:text-white"
                  >
                    <X size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!draftTitle.trim()) return;
                      onUpdateTask?.(task.id, {
                        title: draftTitle.trim(),
                        description: draftDescription,
                        activity: [
                          ...task.activity,
                          {
                            id: crypto.randomUUID(),
                            text: 'Updated task from list view',
                            createdAt: Date.now()
                          }
                        ]
                      });
                      setEditingTaskId(null);
                      setDraftTitle('');
                      setDraftDescription('');
                    }}
                    className="rounded-xl bg-white p-2 text-black transition-all hover:bg-white/90"
                  >
                    <Check size={15} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setEditingTaskId(task.id);
                      setDraftTitle(task.title);
                      setDraftDescription(task.description);
                    }}
                    className="rounded-xl border border-white/10 bg-white/5 p-2 text-brand-muted transition-all hover:border-white/20 hover:text-white"
                  >
                    <PencilLine size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEditTask?.(task);
                    }}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-brand-muted transition-all hover:border-white/20 hover:text-white"
                  >
                    Full edit
                  </button>
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-3 text-xs text-brand-muted sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center gap-2 uppercase tracking-[0.18em]">
                  <Clock3 size={12} />
                  Created
                </div>
                <p className="mt-2 text-sm text-white">{format(task.createdAt, 'MMM d, yyyy')}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center gap-2 uppercase tracking-[0.18em]">
                  <Calendar size={12} />
                  Due
                </div>
                <p className="mt-2 text-sm text-white">
                  {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'No due date'}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center gap-2 uppercase tracking-[0.18em]">
                  <CheckSquare size={12} />
                  Progress
                </div>
                <p className="mt-2 text-sm text-white">
                  {progress.total > 0 ? `${progress.completed}/${progress.total} subtasks` : 'No subtasks yet'}
                </p>
              </div>
            </div>

            {progress.total > 0 && (
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-brand-muted">
                  <span>Progress</span>
                  <span>{progress.percent}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300 transition-all"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
