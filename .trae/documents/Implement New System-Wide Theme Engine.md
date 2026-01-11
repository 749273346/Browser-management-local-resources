I will remove the old theme module from the settings modal and implement a new, comprehensive system-wide theme customization feature.

**Plan:**

1.  **Remove Old Theme Module**:
    *   Modify `SettingsModal.jsx` to remove the existing "主题色" (Theme Color) section in the "appearance" tab.
    *   Remove the `themes` import and `handleThemeChange` related logic from `SettingsModal.jsx`.

2.  **Define New System Themes**:
    *   Update `src/theme.js` to define a new, more robust theme structure. Instead of just colors, each theme will define:
        *   `id`
        *   `name`
        *   `colors` (primary, background, surface, text, border, etc.)
        *   `borderRadius` (for cards and buttons: 'sm', 'md', 'lg', 'xl', '2xl', 'full')
        *   `glassEffect` (opacity and blur presets)
        *   `layoutMode` (compact, comfortable, spacious - affecting padding/margins)
    *   Create 3 distinct new themes:
        *   **"Modern Minimal" (现代极简)**: Flat design, sharp corners, high contrast, clean white/black backgrounds.
        *   **"Glass Morphism" (毛玻璃)**: The current style but enhanced. Rounded corners, translucent backgrounds, blurred overlays.
        *   **"Classic System" (经典系统)**: Traditional OS look. Borders, subtle gradients, standard border-radius, dense information density.

3.  **Implement System-Wide Theme Application**:
    *   Update `applyTheme` in `src/theme.js` to handle the new properties.
    *   Instead of just setting colors, it will set CSS variables for:
        *   `--radius-card`, `--radius-btn`, `--radius-input`
        *   `--spacing-unit` (for layout density)
        *   `--glass-opacity`, `--glass-blur` (override user tweaks if theme enforces it, or set defaults)
    *   Ensure CSS variables are correctly mapped.

4.  **Refactor Components to Use Theme Variables**:
    *   This is the critical step to ensure "buttons, cards, and file styles" change.
    *   I will modify `DashboardView.jsx`, `FileGrid.jsx`, `FileList.jsx`, and `TopBar.jsx`.
    *   Replace hardcoded Tailwind classes (e.g., `rounded-2xl`, `p-6`, `gap-6`) with arbitrary values using CSS variables (e.g., `rounded-[var(--radius-card)]`, `p-[var(--spacing-unit)]`).
    *   *Note*: Since Tailwind arbitrary values with CSS variables can be verbose, I might define a few helper classes in `index.css` or just use the style attribute for dynamic properties if Tailwind's JIT mode doesn't pick them up easily (though `rounded-[var(--r)]` usually works).

5.  **Add New Theme Selector to Settings**:
    *   In `SettingsModal.jsx`, add a new section "界面风格 (Interface Style)".
    *   Display the 3 new theme options with a preview card for each.

6.  **Verify**:
    *   Check that switching themes changes not just colors, but shapes (border-radius) and density (spacing).

**Theme Details:**
*   **Modern**: `--radius: 4px`, `--glass: 1` (opaque), `--spacing: 1rem`
*   **Glass**: `--radius: 16px`, `--glass: 0.7`, `--spacing: 1.5rem`
*   **Classic**: `--radius: 6px`, `--glass: 1`, `--spacing: 0.75rem`, borders visible.

I will start by updating the theme definitions and then proceed to component refactoring.