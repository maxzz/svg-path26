# svg-path26

React + TypeScript + Vite project with a layout style aligned to `trace-viewer-25`.

## Migration target

- Angular-style setup removed in favor of React component structure.
- App shell moved to `src/components/0-all` with numbered module layout.
- State management split by concern:
  - **Jotai** for editor/path data atoms.
  - **Valtio** for UI settings with snapshot-based rendering.

## Run

- `pnpm install`
- `pnpm dev`
- `pnpm build`
