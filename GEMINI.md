# Project Guidelines & Rules: Finalitie Landing

## Production Assets & Visual Standards
1. **Critical Assets Local-First**:
   - Hero images, logos, icons, and primary project mockups must be saved locally in the `images/` folder.
   - Do not rely on ephemeral external Framer CDN URLs for critical components.

2. **3D / WebGL Zero-Void Rule (Mandatory Fallback)**:
   - Any dynamic Hero 3D or WebGL element must always have an instant static fallback image (`images/hero-cube.png`) positioned identically.
   - The fallback renders on frame 0 (`loading="eager"`, `fetchpriority="high"`).
   - Only when WebGL completes its first frame render, cross-fade smoothly to the 3D canvas.
   - If WebGL or script fails, the page remains complete with zero visual defects or white space.

3. **Dependency Integrity**:
   - Every library used (such as Three.js) must be provided locally (`three.min.js`) with an optional CDN fallback.
   - No silent aborts that leave empty placeholders in the UI.
