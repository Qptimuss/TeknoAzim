# AI Rules for Fusion Starter Application

This document outlines the core technologies and best practices for developing with the Fusion Starter template.

## Tech Stack

*   **Frontend:** React 18, React Router 6 (SPA mode), TypeScript, Vite, TailwindCSS 3.
*   **Backend:** Express server, integrated with Vite for development.
*   **Package Manager:** PNPM is the preferred package manager.
*   **Testing:** Vitest for unit and integration tests.
*   **UI Components:** shadcn/ui (built on Radix UI and Tailwind CSS) for pre-built, accessible components.
*   **Icons:** Lucide React for vector icons.
*   **Data Fetching:** React Query (@tanstack/react-query) for server state management.
*   **Form Management:** React Hook Form for form handling, with Zod for schema validation.
*   **Toast Notifications:** Sonner (using `sonner` package) for elegant and customizable toast messages.
*   **CSS Utilities:** `clsx` and `tailwind-merge` combined into a `cn()` utility for robust class merging.

## Library Usage Rules

*   **Routing:** All client-side routing must be handled by **React Router 6**. Routes are defined in `client/App.tsx`, and page components reside in `client/pages/`.
*   **Styling:** **Tailwind CSS 3** is the primary styling framework. Custom themes and design tokens should be configured in `client/global.css` and `tailwind.config.ts`.
*   **UI Components:** Utilize components from the `client/components/ui/` directory (shadcn/ui). **Do not modify these pre-built UI files directly.** If a component needs customization, create a new component that wraps or extends the existing one.
*   **Icons:** Use **Lucide React** for all icons in the application.
*   **Backend APIs:** Implement API routes using **Express** in the `server/` directory. All API endpoints should be prefixed with `/api/`.
*   **Forms:** For any form functionality, use **React Hook Form** for state management and **Zod** for schema validation to ensure type safety and robust validation.
*   **Notifications:** For user feedback and notifications, use the **Sonner** toast system.
*   **Utility Functions:** The `cn()` utility (from `client/lib/utils.ts`) should be used for conditionally combining and merging Tailwind CSS classes.