I will implement the folder color customization feature with inheritance for Level 1 folders.

**Plan:**

1. **Refactor Color Definitions**:

   * Create `src/constants/theme.js` to store the `COLUMN_COLORS` palette. This ensures consistency between the dashboard display and the context menu picker.

2. **Implement Color Persistence in** **`App.jsx`**:

   * Add a new state `folderColors` initialized from `localStorage`.

   * Create a `handleSetColor` function to update the state and persist it to `localStorage`.

   * The data structure will be a map: `{ "folder_path": "color_id" }`.

3. **Update** **`ContextMenu.jsx`**:

   * Add a "设置颜色 (Set Color)" option.

   * This option will display a row of clickable color dots (swatches) corresponding to the available themes.

   * This option will only be visible when right-clicking a Level 1 folder (a direct child of the root).

4. **Update** **`DashboardView.jsx`**:

   * Receive `folderColors` and the `rootPath` (to help determine inheritance) as props.

   * Implement logic to determine the display color for each column:

     * **Level 1 View**: If viewing the root, check if the folder has a specific color set. If yes, use it; otherwise, fall back to the default cycle.

     * **Level 2+ View**: If viewing a sub-folder, check if any ancestor (specifically the Level 1 parent) has a color set. If yes, force that color for all columns in the current view to achieve the "inheritance" effect.

5. **Integration**:

   * Wire everything up in `App.jsx`, passing the necessary props and handlers.

