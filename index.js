/**
 * Host half of dsh-tapeout-3d-lab.
 *
 * The plugin is deliberately browser-only: it teaches the TapeOut protocol with a
 * 3D demo game in the Web GUI, registers nothing model-facing, and owns no Host
 * resources. The bundle row only exists so the package's Client manifest is scanned
 * and its `client.js` bundle is served and loaded by the Web module system.
 */
export function apply() {}
