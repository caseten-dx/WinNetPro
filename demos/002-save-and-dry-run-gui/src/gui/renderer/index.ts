// Phase D placeholder renderer — proves the IPC bridge is wired end-to-end
// (renderer -> preload -> main -> in-process application services -> back).
// Phase E replaces this entirely with the six designed frames against
// tokens.css from docs/research/demo-002-gui-design-handoff/.

import type { WindowApi } from '../api-types.js';

declare global {
  interface Window {
    api: WindowApi;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&'
      ? '&amp;'
      : c === '<'
        ? '&lt;'
        : c === '>'
          ? '&gt;'
          : c === '"'
            ? '&quot;'
            : '&#39;',
  );
}

async function main(): Promise<void> {
  const root = document.getElementById('root');
  if (!root) return;

  try {
    const [adapters, profiles] = await Promise.all([
      window.api.listAdapters(),
      window.api.loadAllProfiles(),
    ]);

    const adapterItems = adapters
      .map((a) => `<li>${escapeHtml(a.id)} — ${escapeHtml(a.windowsAlias ?? '(no alias)')}</li>`)
      .join('');
    const profileItems =
      profiles.length === 0
        ? '<li><em>(no profiles)</em></li>'
        : profiles.map((p) => `<li>${escapeHtml(p.name)}</li>`).join('');

    root.innerHTML = `
      <h1>WinNetPro — demo-002 — Phase D smoke</h1>
      <p>IPC bridge is live. Phase E replaces this view with the designed frames.</p>
      <h2>Adapters (${adapters.length})</h2>
      <ul>${adapterItems}</ul>
      <h2>Profiles (${profiles.length})</h2>
      <ul>${profileItems}</ul>
    `;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    root.innerHTML = `<h1>IPC bridge failure</h1><pre>${escapeHtml(message)}</pre>`;
  }
}

void main();
