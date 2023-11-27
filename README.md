# TaskFlow Pro

TaskFlow Pro is a polished project management workspace built for focused execution. It combines a visually rich kanban board, a planning dashboard, persistent local state, and an integrated AI assistant into a single modern React application.

The app is designed to feel like a premium internal tool: fast to use, visually expressive, and packed with workflow details such as task priorities, subtasks, comments, activity history, progress tracking, project filters, and due-date awareness.

## Overview

TaskFlow Pro helps teams and individuals move work from planning to delivery with a clean workflow:

- organize tasks across custom kanban columns
- track progress with subtasks and completion indicators
- monitor project health from a dashboard with metrics, charts, and timeline views
- search, filter, and switch between board and list representations
- keep context with task comments and activity history
- use the built-in AI assistant for idea exploration and productivity support

## Key Features

- Interactive kanban board with drag-and-drop task management
- Dashboard overview with KPI cards, activity insights, calendar view, and delivery timeline
- Task detail drawer with comments, subtasks, activity history, and quick actions
- Board and list views for different workflow preferences
- Project-aware filtering and navigation
- Priority, assignee, due date, and status management
- Theme switching for alternate presentation styles
- Persistent state powered by Zustand so changes survive refreshes
- Integrated AI assistant using Gemini
- Responsive UI optimized for desktop, tablet, and mobile workflows

## Tech Stack

- React 19
- Vite 6
- TypeScript
- Zustand
- Tailwind CSS v4
- Framer Motion
- Hello Pangea DnD
- date-fns
- Lucide React
- Gemini API via `@google/genai`

## Screenshots

Add screenshots to a `screenshots/` directory and update the references below:

- `screenshots/board.png`
- `screenshots/dashboard.png`
- `screenshots/task-details.png`
- `screenshots/assistant.png`

## Project Structure

```text
src/
  components/    UI components, workspace views, dialogs, and dashboard modules
  data/          Seed workspace data
  lib/           Shared helper utilities
  services/      External integrations such as Gemini
  store/         Zustand state stores
  types/         Shared TypeScript models
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create an environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Add your Gemini API key to `.env.local`:

   ```env
   GEMINI_API_KEY=your_key_here
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the app at:

   ```text
   http://localhost:3001
   ```

## Available Scripts

- `npm run dev` - start the Vite development server
- `npm run build` - create a production build
- `npm run preview` - preview the production build locally
- `npm run lint` - run TypeScript checks
- `npm run clean` - remove the `dist/` directory

## Workflow Highlights

### Dashboard

The dashboard is built as a visible planning surface rather than a simple stats page. It includes:

- animated KPI counters
- delivery pipeline summaries
- activity trend visualization
- team workload summaries
- calendar and timeline planning blocks
- export and share actions

### Task Management

Tasks support much more than a title and status. Each task can include:

- priority
- assignee
- due date
- subtasks
- comments
- activity history
- quick actions such as duplicate, mark done, and delete

### AI Assistant

The integrated assistant workspace provides a separate conversational area powered by Gemini for ideation and support workflows.

## Environment Variables

The application expects:

- `GEMINI_API_KEY` - required for assistant responses

See [.env.example](./.env.example) for the template.

## Build Notes

The current production bundle is feature-rich and may trigger a Vite chunk-size warning during build. The project still builds successfully, but future optimization could split dashboard and assistant functionality into smaller bundles.

## Future Improvements

- persistent ordering for dashboard timeline interactions
- richer analytics and charting
- file attachments and collaboration features
- backend persistence and multi-user support

## License

This project is currently provided without an explicit license file. Add one if you plan to distribute or open-source it publicly.
