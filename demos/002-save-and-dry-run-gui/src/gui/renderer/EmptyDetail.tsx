// Right-pane empty state used in frame 1 (first launch). Centered card with
// an icon, a heading prompting the user to pick an adapter, a two-line
// description, and a "fixture provider · N adapters · M profiles" chip that
// doubles as a Safe-Mode reminder a step away from the banner.

import { Icons } from './icons.js';

interface Props {
  adapterCount: number;
  profileCount: number;
}

export function EmptyDetail({ adapterCount, profileCount }: Props) {
  return (
    <div className="wn-detail-empty">
      <div className="card">
        <div className="icon">
          <Icons.emptyAdapter />
        </div>
        <h2>Select an adapter to view and edit its profile.</h2>
        <p>
          Three fixture adapters are listed on the left. Click any one to see its current IPv4
          configuration and build a profile from it.
        </p>
        <div
          style={{
            marginTop: 'var(--wn-s-7)',
            display: 'flex',
            gap: 'var(--wn-s-3)',
            justifyContent: 'center',
            flexWrap: 'wrap',
            fontSize: 'var(--wn-text-xs)',
            color: 'var(--wn-ink-3)',
          }}
        >
          <span
            className="wn-future-note"
            style={{
              borderStyle: 'solid',
              background: 'var(--wn-accent-soft)',
              borderColor: 'var(--wn-accent-border)',
              color: 'var(--wn-accent-ink)',
            }}
          >
            <span className="dot" style={{ background: 'var(--wn-accent)' }} />
            Fixture provider · {adapterCount} adapter{adapterCount === 1 ? '' : 's'} ·{' '}
            {profileCount} profile{profileCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </div>
  );
}
