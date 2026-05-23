// App root. Loads adapters + profiles via the typed window.api bridge (defined
// in preload.ts, exposed by main.ts), then renders the Shell for frame 1
// (first launch, no adapter selected, no profiles).
//
// Phase E2 adds adapter selection + detail pane; Phase E3 adds the save modal.
// The state shape here grows alongside those phases (selectedAdapterId,
// formDraft, validation, changePlan — per the hand-off's "State management"
// section). For frame 1 we only need adapters/profiles and the theme.

import { useEffect, useState } from 'react';
import type { Adapter, Profile } from '../../domain/types.js';
import { Shell } from './Shell.js';
import { LeftPane } from './LeftPane.js';
import { EmptyDetail } from './EmptyDetail.js';
import type { Theme } from './TitleBar.js';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; adapters: Adapter[]; profiles: Profile[] };

export function App() {
  const [theme, setTheme] = useState<Theme>('light');
  const [load, setLoad] = useState<LoadState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    Promise.all([window.api.listAdapters(), window.api.loadAllProfiles()])
      .then(([adapters, profiles]) => {
        if (cancelled) return;
        setLoad({ kind: 'ready', adapters, profiles });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setLoad({ kind: 'error', message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (load.kind === 'loading') {
    return (
      <Shell theme={theme} onThemeChange={setTheme} statusMeta="Loading adapters…">
        <aside className="wn-left" />
        <main className="wn-right" />
      </Shell>
    );
  }

  if (load.kind === 'error') {
    return (
      <Shell
        theme={theme}
        onThemeChange={setTheme}
        status="failed"
        statusMeta="IPC bridge failure"
      >
        <aside className="wn-left" />
        <main className="wn-right">
          <div className="wn-detail">
            <h1>IPC bridge failure</h1>
            <pre className="mono">{load.message}</pre>
          </div>
        </main>
      </Shell>
    );
  }

  const { adapters, profiles } = load;
  return (
    <Shell
      theme={theme}
      onThemeChange={setTheme}
      status="idle"
      statusMeta="Ready · select an adapter to begin"
    >
      <LeftPane
        adapters={adapters}
        profiles={profiles}
        selectedId={null}
        onSelect={() => {
          // Phase E2 wires this to setSelectedAdapterId; for frame 1 the
          // adapter list is visually selectable but the detail pane stays on
          // the empty state.
        }}
      />
      <main className="wn-right">
        <EmptyDetail adapterCount={adapters.length} profileCount={profiles.length} />
      </main>
    </Shell>
  );
}
