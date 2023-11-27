import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock3,
  Copy,
  FolderKanban,
  PencilLine,
  Plus,
  Tag,
  Trash2,
  User2,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { Task } from '../types/task';
import { WORKSPACE_PROJECTS } from '../data/workspace';
import { cn } from '../lib/utils';

interface TaskDetailsDrawerProps {
  task: Task | null;
  columnTitle?: string;
  onClose: () => void;
  onEdit?: (task: Task) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  onDuplicate?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onMarkDone?: (task: Task) => void;
  onAddComment?: (task: Task, content: string) => void;
}

const getDueDateAccent = (dueDate?: string) => {
  if (!dueDate) return 'text-brand-muted';

  const due = new Date(dueDate);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((startOfDue.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'text-rose-300';
  if (diffDays === 0) return 'text-amber-200';
  if (diffDays <= 3) return 'text-cyan-200';
  return 'text-brand-muted';
};

const priorityClasses = {
  low: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  medium: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  high: 'border-rose-500/30 bg-rose-500/10 text-rose-300'
} as const;

export const TaskDetailsDrawer = ({
  task,
  columnTitle,
  onClose,
  onEdit,
  onUpdateTask,
  onDuplicate,
  onDelete,
  onMarkDone,
  onAddComment
}: TaskDetailsDrawerProps) => {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const project = WORKSPACE_PROJECTS.find((item) => item.id === task?.projectId);
  const dueDateAccent = getDueDateAccent(task?.dueDate);
  const completedSubtasks = task?.subtasks.filter((subtask) => subtask.completed).length ?? 0;
  const subtaskPercent = task && task.subtasks.length > 0
    ? Math.round((completedSubtasks / task.subtasks.length) * 100)
    : 0;

  useEffect(() => {
    setNewSubtaskTitle('');
    setNewComment('');
  }, [task?.id]);

  const handleToggleSubtask = (subtaskId: string) => {
    if (!task) return;
    const toggledSubtask = task.subtasks.find((subtask) => subtask.id === subtaskId);
    const isCompleting = toggledSubtask ? !toggledSubtask.completed : false;
    onUpdateTask?.(task.id, {
      subtasks: task.subtasks.map((subtask) =>
        subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
      ),
      activity: toggledSubtask
        ? [
            ...task.activity,
            {
              id: crypto.randomUUID(),
              text: `${isCompleting ? 'Completed' : 'Reopened'} subtask "${toggledSubtask.title}"`,
              createdAt: Date.now()
            }
          ]
        : task.activity
    });
  };

  const handleAddSubtask = () => {
    if (!task || !newSubtaskTitle.trim()) return;

    onUpdateTask?.(task.id, {
      subtasks: [
        ...task.subtasks,
        {
          id: crypto.randomUUID(),
          title: newSubtaskTitle.trim(),
          completed: false
        }
      ],
      activity: [
        ...task.activity,
        {
          id: crypto.randomUUID(),
          text: `Added subtask "${newSubtaskTitle.trim()}"`,
          createdAt: Date.now()
        }
      ]
    });
    setNewSubtaskTitle('');
  };

  return (
    <AnimatePresence>
      {task && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.button
            type="button"
            aria-label="Close task details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
          />

          <motion.aside
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 32 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-brand-surface/95 shadow-2xl shadow-black/40 backdrop-blur-xl"
          >
            <div className="border-b border-white/10 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em]',
                        priorityClasses[task.priority]
                      )}
                    >
                      {task.priority}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-muted">
                      {columnTitle ?? 'Task'}
                    </span>
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold tracking-tight">{task.title}</h2>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-brand-muted">
                    {task.description || 'No description yet. Use edit to add more context for this task.'}
                  </p>
                </div>

                <button
                  onClick={onClose}
                  className="rounded-xl p-2 text-brand-muted transition-colors hover:bg-white/5 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onEdit?.(task)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-white/90"
                >
                  <PencilLine size={15} />
                  Edit task
                </button>
                <button
                  type="button"
                  onClick={() => onMarkDone?.(task)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-brand-muted transition-all hover:border-white/20 hover:text-white"
                >
                  <CheckCircle2 size={15} />
                  Mark done
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
              <section className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-brand-muted">
                    <FolderKanban size={13} />
                    Project
                  </div>
                  <p className="mt-3 text-sm font-medium">{project?.name ?? 'Unknown project'}</p>
                  <p className="mt-1 text-xs text-brand-muted">
                    {project?.description ?? 'No project description available.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-brand-muted">
                    <User2 size={13} />
                    Assignee
                  </div>
                  <p className="mt-3 text-sm font-medium">{task.assignee ?? 'Unassigned'}</p>
                  <p className="mt-1 text-xs text-brand-muted">Owner of the next action on this task.</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-brand-muted">
                    <Calendar size={13} />
                    Due date
                  </div>
                  <p className={cn('mt-3 text-sm font-medium', dueDateAccent)}>
                    {task.dueDate ? format(new Date(task.dueDate), 'MMMM d, yyyy') : 'No due date set'}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-brand-muted">
                    <Clock3 size={13} />
                    Created
                  </div>
                  <p className="mt-3 text-sm font-medium">{format(task.createdAt, 'MMMM d, yyyy')}</p>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-brand-muted">
                  <Tag size={13} />
                  Tags
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {task.tags.length > 0 ? (
                    task.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/85"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-brand-muted">No tags yet.</p>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-brand-muted">
                    <CheckSquare size={13} />
                    Subtasks
                  </div>
                  <div className="text-xs text-brand-muted">
                    {task.subtasks.length > 0 ? `${completedSubtasks}/${task.subtasks.length} complete` : 'No checklist yet'}
                  </div>
                </div>

                {task.subtasks.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-brand-muted">
                      <span>Progress</span>
                      <span>{subtaskPercent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300 transition-all"
                        style={{ width: `${subtaskPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  {task.subtasks.map((subtask) => (
                    <button
                      key={subtask.id}
                      type="button"
                      onClick={() => handleToggleSubtask(subtask.id)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-all hover:border-white/20"
                    >
                      <span
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-md border text-[10px]',
                          subtask.completed
                            ? 'border-emerald-400/40 bg-emerald-400/20 text-emerald-200'
                            : 'border-white/15 bg-transparent text-transparent'
                        )}
                      >
                        ✓
                      </span>
                      <span className={cn('text-sm', subtask.completed ? 'text-brand-muted line-through' : 'text-white')}>
                        {subtask.title}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(event) => setNewSubtaskTitle(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    placeholder="Add a subtask"
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none transition-all focus:border-white/20"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-brand-muted transition-all hover:border-white/20 hover:text-white"
                  >
                    <Plus size={14} />
                    Add
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-brand-muted">Quick actions</div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onDuplicate?.(task)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-brand-muted transition-all hover:border-white/20 hover:text-white"
                  >
                    <Copy size={14} />
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete?.(task)}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-200 transition-all hover:bg-rose-500/15"
                  >
                    <Trash2 size={14} />
                    Delete task
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-brand-muted">Comments</div>
                <div className="mt-4 space-y-3">
                  {task.comments.length > 0 ? (
                    task.comments
                      .slice()
                      .sort((a, b) => b.createdAt - a.createdAt)
                      .map((comment) => (
                        <div key={comment.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium">{comment.author}</p>
                            <p className="text-[11px] uppercase tracking-[0.18em] text-brand-muted">
                              {format(comment.createdAt, 'MMM d, h:mm a')}
                            </p>
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-brand-muted">{comment.content}</p>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-brand-muted">No comments yet.</p>
                  )}
                </div>
                <div className="mt-4 space-y-3">
                  <textarea
                    value={newComment}
                    onChange={(event) => setNewComment(event.target.value)}
                    rows={3}
                    placeholder="Add a comment or status note"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition-all focus:border-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newComment.trim()) return;
                      onAddComment?.(task, newComment.trim());
                      setNewComment('');
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-white/90"
                  >
                    <Plus size={14} />
                    Add comment
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-brand-muted">Activity</div>
                <div className="mt-4 space-y-3">
                  {task.activity.length > 0 ? (
                    task.activity
                      .slice()
                      .sort((a, b) => b.createdAt - a.createdAt)
                      .map((entry) => (
                        <div key={entry.id} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                          <div className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300" />
                          <div>
                            <p className="text-sm text-white">{entry.text}</p>
                            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-brand-muted">
                              {format(entry.createdAt, 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                      ))
                  ) : (
                    <p className="text-sm text-brand-muted">No activity recorded yet.</p>
                  )}
                </div>
              </section>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};
