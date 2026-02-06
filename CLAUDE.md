# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm install          # Install dependencies (use --legacy-peer-deps if peer dependency errors occur)
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

## Tech Stack

- Next.js 16 with App Router
- React 19
- TypeScript
- Tailwind CSS v4

## Project Architecture

### App Router Structure

The app uses Next.js App Router with route groups for layout organization:

- `src/app/(admin)/` - Admin dashboard pages with sidebar layout (AdminLayout)
- `src/app/(full-width-pages)/` - Full-width pages (auth, error pages) without sidebar

Route groups in parentheses like `(admin)`, `(others-pages)`, `(ui-elements)` organize routes without affecting URL paths.

### Layout Hierarchy

1. **Root Layout** (`src/app/layout.tsx`) - Provides ThemeProvider and SidebarProvider contexts
2. **Admin Layout** (`src/app/(admin)/layout.tsx`) - Client component with sidebar, header, and responsive main content area
3. **Auth Layout** (`src/app/(full-width-pages)/(auth)/layout.tsx`) - Minimal layout for auth pages

### Global State (Context)

- `src/context/ThemeContext.tsx` - Light/dark theme toggle with localStorage persistence. Use `useTheme()` hook.
- `src/context/SidebarContext.tsx` - Sidebar expand/collapse, mobile menu, hover states. Use `useSidebar()` hook.

### Key Directories

- `src/layout/` - App shell components (AppHeader, AppSidebar, Backdrop)
- `src/components/ui/` - Reusable UI primitives (Button, Alert, Badge, Modal, etc.)
- `src/components/form/` - Form inputs and elements
- `src/components/charts/` - ApexCharts wrapper components
- `src/components/ecommerce/` - Dashboard-specific components
- `src/icons/` - SVG icon components (imported via @svgr/webpack)

### Path Aliases

Use `@/*` to import from `src/*` (configured in tsconfig.json).

### SVG Handling

SVGs are transformed to React components via @svgr/webpack. Import SVGs directly as components:
```tsx
import { IconName } from "@/icons";
```

### Sidebar Navigation

Navigation items are defined in `src/layout/AppSidebar.tsx` via `navItems` and `othersItems` arrays. Each item can have nested `subItems` for dropdown menus.

## Post-Edit Quality Protocol

After every code edit, when you see the "SEQUENTIAL THINKING REVIEW REQUIRED" hook message, you MUST call `mcp__sequential-thinking__sequentialthinking` and perform a multi-step analysis:

1. **Intent** — What was the purpose of this change?
2. **Logic trace** — Walk through the code path. Does it handle all input scenarios?
3. **Edge cases** — null, undefined, empty arrays, 0, empty strings, race conditions
4. **Error handling** — What happens when things fail? Are errors caught or silently swallowed?
5. **Type safety** — Any implicit `any` types, missing generics, or unsafe casts?
6. **Regressions** — Could this change break existing functionality elsewhere?
7. **Verdict** — PASS or FAIL with clear reasoning

**Rules:**
- If FAIL → fix the issues immediately before moving on
- If PASS → continue to the next task
- Do NOT skip this step
- Do NOT collapse the analysis into a single sentence
- Use sequential thinking for genuine multi-step reasoning, not a summary

## Communication Style

- Be direct. No filler phrases like "You're right" or "Great question"
- Focus on the solution, not the explanation of what you're about to do
- If editing code, verify it compiles before reporting success