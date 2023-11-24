import React, { useEffect, useRef, useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { TaskCard } from './TaskCard';
import { Task } from '../types/task';
import { ChevronRight, Minus, MoreHorizontal, PencilLine, Plus, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  onAddTask?: (columnId: string) => void;
  onEditTask?: (task: Task) => void;
  onOpenTask?: (task: Task) => void;
  onDuplicateTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  onMarkTaskDone?: (task: Task) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: (columnId: string) => void;
  onRename?: (columnId: string) => void;
  onDelete?: (columnId: string) => void;
  canDelete?: boolean;
}

export const Column = ({
  id,
  title,
  tasks,
  onAddTask,
  onEditTask,
  onOpenTask,
  onDuplicateTask,
  onDeleteTask,
  onMarkTaskDone,
  isCollapsed = false,
  onToggleCollapse,
  onRename,
  onDelete,
  canDelete = true
}: ColumnProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    <div
      className={cn(
        "flex shrink-0 h-full flex-col transition-all duration-300",
        isCollapsed ? "w-20" : "w-[15.75rem] md:w-[17rem] xl:w-80"
      )}
    >
      <div className="flex items-center justify-between px-2 mb-4">
        {isCollapsed ? (
          <button
            type="button"
            onClick={() => onToggleCollapse?.(id)}
            className="flex w-full flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-4 text-brand-muted transition-all hover:border-white/20 hover:text-white"
          >
            <ChevronRight size={16} />
            <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-semibold uppercase tracking-[0.22em]">
              {title}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-white">
              {tasks.length}
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-widest opacity-60">
              {title}
            </h3>
            <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold">
              {tasks.length}
            </span>
          </div>
        )}
        {!isCollapsed && (
        <div className="flex items-center gap-1 relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => onToggleCollapse?.(id)}
            className="p-1.5 hover:bg-white/5 rounded-lg transition-all text-brand-muted hover:text-white"
          >
            <Minus size={16} />
          </button>
          <button
            onClick={() => onAddTask?.(id)}
            className="p-1.5 hover:bg-white/5 rounded-lg transition-all text-brand-muted hover:text-white"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="p-1.5 hover:bg-white/5 rounded-lg transition-all text-brand-muted hover:text-white"
          >
            <MoreHorizontal size={16} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-9 w-40 bg-brand-surface/90 border border-white/10 rounded-xl shadow-xl p-1 z-20 backdrop-blur-xl">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onRename?.(id);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-brand-muted hover:text-white hover:bg-white/5"
              >
                <PencilLine size={14} />
                Rename
              </button>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  if (canDelete) {
                    onDelete?.(id);
                  }
                }}
                disabled={!canDelete}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs",
                  canDelete
                    ? "text-red-400 hover:bg-red-500/10"
                    : "text-brand-muted cursor-not-allowed"
                )}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
        )}
      </div>

      {isCollapsed ? null : (
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "relative flex-1 px-2 py-1 rounded-2xl transition-all min-h-[150px]",
              snapshot.isDraggingOver
                ? "bg-white/[0.06] ring-1 ring-white/20 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                : "bg-transparent"
            )}
          >
            {snapshot.isDraggingOver && (
              <div className="mb-3 rounded-xl border border-dashed border-white/20 bg-white/[0.04] px-3 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-white/70">
                Drop task here
              </div>
            )}
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onEdit={onEditTask}
                onOpen={onOpenTask}
                onDuplicate={onDuplicateTask}
                onDelete={onDeleteTask}
                onMarkDone={onMarkTaskDone}
              />
            ))}
            {tasks.length === 0 && (
              <div
                className={cn(
                  "px-3 py-4 text-xs border border-dashed rounded-xl transition-all",
                  snapshot.isDraggingOver
                    ? "border-white/25 bg-white/[0.05] text-white/80"
                    : "border-white/15 bg-white/[0.02] text-brand-muted"
                )}
              >
                {snapshot.isDraggingOver
                  ? 'Release to move this task into the column.'
                  : 'No tasks yet. Add a new task to get started.'}
              </div>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      )}
    </div>
  );
};
