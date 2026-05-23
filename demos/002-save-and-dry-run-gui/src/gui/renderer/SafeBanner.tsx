// Safe-Mode banner (frames 1-5 of the hand-off). Demo-002 always renders the
// 'safe' variant — the fixture provider is the only provider wired in. The
// 'real-ready' (amber) variant is included for demo-003's preview frame so
// the visual shape is ready when that demo arrives.

import { Icons } from './icons.js';

export type SafeBannerVariant = 'safe' | 'real-ready';

interface Props {
  variant?: SafeBannerVariant;
  demoLabel?: string;
}

export function SafeBanner({ variant = 'safe', demoLabel = 'demo-002' }: Props) {
  if (variant === 'real-ready') {
    return (
      <div
        className="wn-safe-banner"
        style={{
          background: 'var(--wn-warn-soft)',
          borderBottomColor: 'var(--wn-warn-border)',
          color: 'var(--wn-warn-ink)',
        }}
      >
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: 'var(--wn-warn)',
          }}
        />
        <span className="badge" style={{ background: 'var(--wn-warn)' }}>
          <Icons.shieldSmall /> Real provider · arm to mutate
        </span>
        <span className="why">
          Apply <b>will modify</b> Windows network state. Snapshots and rollback are armed.
        </span>
        <span className="demo-pill" style={{ borderColor: 'var(--wn-warn-border)' }}>
          {demoLabel} preview
        </span>
      </div>
    );
  }
  return (
    <div className="wn-safe-banner">
      <span className="badge">
        <Icons.shieldSmall /> Safe mode
      </span>
      <span className="why">
        Fixture provider — <b>no</b> real network changes can occur in this demo. Real apply
        lands in demo-003.
      </span>
      <span className="demo-pill">{demoLabel}</span>
    </div>
  );
}
