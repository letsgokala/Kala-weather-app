import React, { useEffect, useRef, useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Task, Priority } from '../types/task';
import { cn } from '../lib/utils';
import { Calendar, CheckCircle2, Clock, Copy, PencilLine, Trash2, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  index: number;
  onEdit?: (task: Task) => void;
  onOpen?: (task: Task) => void;
  onDuplicate?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onMarkDone?: (task: Task) => void;
}

const priorityColors: Record<Priority, string> = {
  low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  high: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
};

const getInitials = (name?: string) => {
  if (!name) return '??';
  const parts = name.split(' ').filter(Boolean);
  const initials = parts.map((part) => part[0]).join('');
  return initials.slice(0, 2).toUpperCase();
};

const getDueDateAppearance = (dueDate?: string) => {
  if (!dueDate) return null;

  const due = new Date(dueDate);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((startOfDue.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `Overdue ${format(due, 'MMM d')}`,
      className: 'border-rose-500/25 bg-rose-500/10 text-rose-300'
    };
  }

  if (diffDays === 0) {
    return {
      label: 'Due today',
      className: 'border-amber-500/30 bg-amber-500/10 text-amber-200'
    };
  }

  if (diffDays <= 3) {
    return {
      label: `Due ${format(due, 'MMM d')}`,
      className: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-200'
    };
  }

  return {
    label: format(due, 'MMM d'),
    className: 'border-white/10 bg-white/5 text-brand-muted'
  };
};

export const TaskCard = ({
  task,
  index,
  onEdit,
  onOpen,
  onDuplicate,
  onDelete,
  onMarkDone
}: TaskCardProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dueDateLabel = task.dueDate ? format(new Date(task.dueDate), 'MMM d') : null;
  const dueDateAppearance = getDueDateAppearance(task.dueDate);
  const completedSubtasks = task.subtasks.filter((subtask) => subtask.completed).length;
  const subtaskProgress = task.subtasks.length > 0 ? Math.round((completedSubtasks / task.subtasks.length) * 100) : 0;

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onOpen?.(task)}
          className={cn(
            "group cursor-pointer bg-white/[0.04] border border-white/10 rounded-xl p-4 mb-3 transition-all hover:border-white/30 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.35)]",
            snapshot.isDragging ? "scale-[1.02] shadow-2xl border-white/40 rotate-2 ring-2 ring-white/15" : ""
          )}
        >
          <div className="flex items-start justify-between mb-2">
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border",
              priorityColors[task.priority]
            )}>
              {task.priority}
            </span>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsMenuOpen((prev) => !prev);
                }}
                className="p-1 rounded-md opacity-0 transition-all hover:bg-white/5 group-hover:opacity-100"
              >
                <MoreHorizontal size={14} className="text-brand-muted" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-8 z-20 w-36 rounded-xl border border-white/10 bg-brand-surface/95 p-1 shadow-xl backdrop-blur-xl">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsMenuOpen(false);
                      onEdit?.(task);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-brand-muted transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <PencilLine size={14} />
                    Edit task
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsMenuOpen(false);
                      onMarkDone?.(task);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-brand-muted transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <CheckCircle2 size={14} />
                    Mark done
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsMenuOpen(false);
                      onDuplicate?.(task);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-brand-muted transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <Copy size={14} />
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsMenuOpen(false);
                      onDelete?.(task);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-rose-300 transition-colors hover:bg-rose-500/10"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <h4 className="text-sm font-medium mb-1 line-clamp-2">{task.title}</h4>
          <p className="text-xs text-brand-muted mb-4 line-clamp-3 leading-relaxed">
            {task.description}
          </p>

          {task.subtasks.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-brand-muted">
                <span>{completedSubtasks}/{task.subtasks.length} subtasks</span>
                <span>{subtaskProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-300 transition-all"
                  style={{ width: `${subtaskProgress}%` }}
                />
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 text-[10px] text-brand-muted">
              <span className="flex items-center gap-1.5">
                <Clock size={12} />
                <span>{format(task.createdAt, 'MMM d')}</span>
              </span>
              {dueDateLabel && (
                <span
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2 py-1",
                    dueDateAppearance?.className ?? "border-white/10 bg-white/5"
                  )}
                >
                  <Calendar size={12} />
                  <span>{dueDateAppearance?.label ?? dueDateLabel}</span>
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full border border-white/10 bg-gradient-to-br from-indigo-500 to-cyan-400 text-[10px] font-bold text-white flex items-center justify-center shadow-md shadow-indigo-500/30">
                {getInitials(task.assignee)}
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};
