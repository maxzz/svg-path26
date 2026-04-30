Implement dual React export generators in the Export SVG dialog.

Context:
- This app runs entirely in the browser.
- No external or server calls are allowed.
- The generator selector belongs in the Export SVG dialog, not in the global Options dialog.
- Keep the existing SVG export flow working.

Primary goal:
- Add a persisted "Export as React component" option after the SVG code section.
- When enabled, export a `.tsx` file instead of `.svg`.
- Provide two generator strategies in separate files and let the user choose which one to use.

Required behavior:
- Use Jotai atoms for dialog actions and derived export state.
- Persist the new export settings in local storage as part of `appSettings.export`.
- Do not use `dangerouslySetInnerHTML`.
- The downloaded file name must be lowercase.
- Convert SVG element attributes into Tailwind v4 classes where practical.
- If an SVG contains only `path` elements and they share the same presentational attributes, hoist those shared attributes to the root `svg` element.

Generator strategies:
- Option 1: local template + recursive JSX emitter.
- Option 4: library-driven generator in a separate file.
- If `@svgr/core` is not truly browser-viable in this app, keep the same UI and replace option 4 with a second fully local generator instead of introducing any remote call or Node-only step.

Implementation phases:

1. Shared export source
- Stop building export output from only the raw path string.
- Base export generation on the current SVG document snapshot when available.
- Reuse the existing SVG document model and fallback synthesis behavior so raw-path-only sessions still export correctly.
- Apply export viewBox and fill/stroke overrides in this shared source layer before format-specific generation.

2. Persisted settings and dialog controls
- Extend `appSettings.export` with:
	- `exportAsReactComponent: boolean`
	- `reactComponentGenerator: string-union`
- Normalize and default those settings in the existing UI settings schema.
- Add compact controls after the SVG code section in the Export SVG dialog.
- Use write-only Jotai action atoms for toggling the mode, switching generator strategy, refreshing derived output, and handling copy/export actions.

3. Shared React normalization
- Build a shared utility layer for React export that:
	- normalizes SVG attribute names to JSX-safe names
	- converts a safe whitelist of presentational attributes to Tailwind v4 classes
	- preserves unmatched attributes as JSX props
	- hoists shared path attributes to the root `svg` when the document qualifies
	- normalizes file naming to lowercase for download

4. Option 1 generator
- Implement a local TSX generator in its own file.
- Use a fixed component template plus recursive JSX emission.
- Keep component identifiers PascalCase inside the file.
- Keep downloaded file names lowercase.

5. Option 4 generator
- Implement the library-driven path in its own file.
- First do a narrow browser-only viability spike for `@svgr/core` + `@svgr/plugin-jsx` inside this Vite app.
- Only keep that implementation if it bundles and executes entirely in the client.
- If it fails that check, replace option 4 with a second local generator and keep the selector/UI unchanged.

6. Export branching
- When React export is off, keep the current `.svg` export behavior.
- When React export is on, generate `.tsx` content using the selected strategy.
- Surface generation errors in the dialog and do not download invalid output.

7. Tests and validation
- Add focused tests for:
	- shared source fallback from raw path data
	- shared-path-attribute hoisting
	- Tailwind attribute conversion
	- lowercase download naming
	- option 1 JSX emission
	- option 4 viability or fallback behavior
	- atom-level settings selection and persistence
- Run focused tests first, then a full build.

Suggested implementation surface:
- `src/components/4-dialogs/5-export-path/0-export-svg-dialog.tsx`
- `src/components/4-dialogs/5-export-path/6-react-export-controls.tsx`
- `src/components/4-dialogs/5-export-path/7-export-utils.tsx`
- `src/components/4-dialogs/5-export-path/8-dialog-export-atoms.ts`
- `src/components/4-dialogs/5-export-path/9-react-export-common.ts`
- `src/components/4-dialogs/5-export-path/10-react-export-template.ts`
- `src/components/4-dialogs/5-export-path/11-react-export-svgr.ts`
- `src/store/9-ui-settings-types-and-defaults.ts`
- `src/store/1-ui-settings-normalize.ts`
- `src/store/0-atoms/1-3-svg-input.ts`
- `src/store/0-atoms/1-3-svg-input-state.ts`
- `src/svg-core/3-svg-input.ts`

Acceptance criteria:
- A checkbox after the SVG code section enables React component export.
- The selected generator strategy is persisted in `appSettings.export`.
- The export dialog can download valid `.tsx` output with no server calls.
- Option 1 works fully locally.
- Option 4 is either fully browser-viable locally or replaced by a second local generator.
- No `dangerouslySetInnerHTML` is introduced for React export.
- Exported file names are lowercase.
- Shared path presentational attributes are hoisted when applicable.
- Tailwind v4 class conversion is applied where practical without breaking unmatched attributes.
- The existing `.svg` export path continues to work.

Validation checklist:
- Run a focused Vitest file for the new export slice.
- Run any touched atom tests.
- Run `pnpm build`.
- Manually verify raw-path export, imported full-SVG export, generator switching, persistence after reload, lowercase file naming, and error handling in the dialog.
