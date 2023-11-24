import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Layers3, PencilLine, X } from 'lucide-react';

interface ColumnModalProps {
  isOpen: boolean;
  mode: 'create' | 'rename';
  initialValue?: string;
  onClose: () => void;
  onSubmit: (title: string) => void;
}

export const ColumnModal = ({
  isOpen,
  mode,
  initialValue = '',
  onClose,
  onSubmit
}: ColumnModalProps) => {
  const [title, setTitle] = useState(initialValue);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(initialValue);
  }, [initialValue, isOpen]);

  const isRename = mode === 'rename';

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    onSubmit(trimmedTitle);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close column modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 18 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/12 bg-brand-surface/95 shadow-2xl shadow-black/40 backdrop-blur-xl"
          >
            <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6">
                    {isRename ? <PencilLine size={18} /> : <Layers3 size={18} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">
                      {isRename ? 'Rename Column' : 'Create New Column'}
                    </h3>
                    <p className="mt-1 text-sm text-brand-muted">
                      {isRename
                        ? 'Give this section a clearer name without leaving the board.'
                        : 'Add a new section to shape the workflow the way you need it.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-xl p-2 text-brand-muted transition-colors hover:bg-white/5 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
                  Column Name
                </label>
                <input
                  autoFocus
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={isRename ? 'Update this column title' : 'For example: Blocked or QA'}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition-all focus:border-white/25 focus:bg-white/[0.07]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-brand-muted transition-all hover:border-white/20 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRename ? 'Save Changes' : 'Add Column'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
