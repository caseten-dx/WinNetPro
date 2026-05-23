// Bottom status bar: state chip + meta on the left, optional tail + "Show log"
// link on the right. The state chip rotates through the gui-spec.md state
// machine (idle → pending → validating → applying → applied | failed |
// rolled-back). Demo-002 only exercises idle / pending / applied / failed;
// tokens.css reserves visual space for the rest so demo-003 doesn't redraw.

import type { ReactNode } from 'react';

export type Status = 'idle' | 'pending' | 'validating' | 'applying' | 'applied' | 'failed' | 'rolled-back';

interface Props {
  status?: Status;
  meta?: string;
  tail?: ReactNode;
}

export function StatusBar({ status = 'idle', meta = 'Ready', tail = null }: Props) {
  return (
    <div className="wn-statusbar">
      <div className="lhs">
        <span className={`wn-status ${status}`}>
          <i />
          {status}
        </span>
        <span style={{ color: 'var(--wn-ink-3)' }}>·</span>
        <span>{meta}</span>
      </div>
      <div className="rhs">
        {tail}
        <button type="button" className="more">Show log</button>
      </div>
    </div>
  );
}
