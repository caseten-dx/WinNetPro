// Win11 custom title bar: app glyph + breadcrumb left, optional center text,
// auto-apply + theme toggle + 3 caption buttons right. The whole strip is
// -webkit-app-region: drag (set in tokens.css); .tb-right and .wn-caption
// opt back into no-drag so the controls remain clickable.
//
// demo-002 caveats:
// - Auto-apply toggle is visible but inert (per ADR-0008, resets on launch).
// - Caption buttons are rendered for visual fidelity; wired in a later phase
//   when we touch the BrowserWindow window-control surface.

import { Icons } from './icons.js';

export type Theme = 'light' | 'dark';

interface Props {
  theme: Theme;
  onThemeChange: (next: Theme) => void;
  // Explicit `| undefined` so forwarding from Shell (where the prop is
  // optional and undefined-by-default) typechecks under
  // exactOptionalPropertyTypes: true.
  centerText?: string | undefined;
  demoLabel?: string;
}

export function TitleBar({ theme, onThemeChange, centerText, demoLabel = 'demo-002' }: Props) {
  return (
    <div className="wn-titlebar">
      <div className="tb-left">
        <span className="tb-app-glyph">
          <Icons.appGlyph />
        </span>
        <span className="tb-title">WinNetPro</span>
        <span className="tb-sep">·</span>
        <span className="mono">{demoLabel}</span>
        <span className="tb-sep">·</span>
        <span>fixture provider</span>
      </div>
      <div className="tb-center">
        {centerText ? (
          <span className="mono" style={{ color: 'var(--wn-ink-3)' }}>
            {centerText}
          </span>
        ) : null}
      </div>
      <div className="tb-right">
        <span className="wn-toggle" title="Auto-apply is OFF — toggle disabled in demo-002">
          <span style={{ opacity: 0.6 }}>Auto-apply</span>
          <span className="sw" />
        </span>
        <button
          type="button"
          className="wn-theme-toggle"
          onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          aria-label="Toggle theme"
        >
          <span className={theme === 'light' ? 'on' : ''} aria-hidden="true">
            <Icons.sun />
          </span>
          <span className={theme === 'dark' ? 'on' : ''} aria-hidden="true">
            <Icons.moon />
          </span>
        </button>
      </div>
      <div className="wn-caption">
        <button title="Minimise" aria-label="Minimise"><Icons.capMin /></button>
        <button title="Maximise" aria-label="Maximise"><Icons.capMax /></button>
        <button className="close" title="Close" aria-label="Close"><Icons.capClose /></button>
      </div>
    </div>
  );
}
