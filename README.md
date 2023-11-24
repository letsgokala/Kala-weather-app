# TaskFlow Pro

TaskFlow Pro is a modern workspace for planning, prioritizing, and shipping work. It combines a kanban board, project dashboard, persistent task state, and an integrated AI assistant into a polished React application.

## Tech Stack

- React 19 + Vite 6
- TypeScript
- Zustand (state + persistence)
- Tailwind CSS v4
- Hello Pangea DnD
- Framer Motion
- Gemini API via `@google/genai`

## Features

- Multi-column Kanban board with drag-and-drop
- Dashboard overview with metrics, activity, calendar, and delivery timeline
- Task priorities, subtasks, activity history, comments, and timestamps
- Quick add and edit task modals
- Search and filter across tasks
- List and board views
- Theme switching
- Persistent board state
- AI assistant workspace

## Screenshots

Add screenshots to `./screenshots` and update the references below:

- `screenshots/board.png`
- `screenshots/dashboard.png`
- `screenshots/task-modal.png`
- `screenshots/assistant.png`

## Getting Started

1. Install dependencies:
   `npm install`
2. Create an `.env.local` file with your Gemini API key:
   `GEMINI_API_KEY=your_key_here`
3. Start the dev server:
   `npm run dev`

## Scripts

- `npm run dev` - start the Vite dev server
- `npm run build` - build for production
- `npm run preview` - preview the production build
- `npm run lint` - run TypeScript checks

## Project Structure

- `src/components` - UI building blocks and workspace views
- `src/store` - Zustand state stores
- `src/services` - Gemini integration
- `src/data` - workspace seed data
- `src/types` - shared TypeScript models
