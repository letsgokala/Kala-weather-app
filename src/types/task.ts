export type Priority = 'low' | 'medium' | 'high';
export type ColumnId = string;
export type ProjectId = string;
export type AssigneeId = string;

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface CommentEntry {
  id: string;
  author: string;
  content: string;
  createdAt: number;
}

export interface ActivityEntry {
  id: string;
  text: string;
  createdAt: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: ColumnId;
  priority: Priority;
  createdAt: number;
  tags: string[];
  projectId: ProjectId;
  assignee?: AssigneeId;
  dueDate?: string;
  subtasks: Subtask[];
  comments: CommentEntry[];
  activity: ActivityEntry[];
}

export interface Column {
  id: ColumnId;
  title: string;
  taskIds: string[];
}
