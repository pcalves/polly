# AGENT.md - Bosschat Development Guide

## Commands
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm start` - Start production server
- No test command configured - check with user before adding tests

## Code Styl
- TypeScript strict mode with ES2017 target
- Use @ path alias for src/ imports (`@/components`, `@/lib`, etc.)
- Prefer `interface` over `type` for object definitions
- Use `export interface` for types, `export type` for unions/aliases
- Export individual functions rather than default exports in utility files

## Components
- Use "use client" directive for client components
- Prefer function components with PascalCase names
- Use memo() for performance optimization when needed
- Props interfaces should end with "Props"
- Use cn() utility for conditional className merging with Tailwind

## React Performance Best Practices
- Use memo() for expensive computations or frequent re-renders
- Use useCallback() for stable function references passed to memoized components
- Use useMemo() for expensive calculations that depend on specific values
- Avoid creating objects/arrays in render - move to useMemo or module level
- Place useEffect dependencies in dependency array - use exhaustive-deps ESLint rule
- Prefer state colocation - keep state close to where it's used
- Use key prop correctly for list items to help React's reconciliation

## Naming Conventions
- Files: kebab-case (chat-message.tsx)
- Functions: camelCase
- Components: PascalCase
- Constants: UPPER_SNAKE_CASE

## Error Handling
- Use try/catch for async operations
- Return boolean success/failure when appropriate
- Use optional chaining (?.) and nullish coalescing (??)
