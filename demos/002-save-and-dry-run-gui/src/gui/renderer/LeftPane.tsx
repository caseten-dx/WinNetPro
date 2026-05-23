// Left rail: section header + refresh row + scrollable adapter list, with a
// Profiles sub-pane pinned to the bottom (max 38% height). Both lists carry
// teaching microcopy in their empty states (the brief: every blank rectangle
// gets a sentence explaining what fills it).

import type { Adapter, Profile } from '../../domain/types.js';
import { Icons, pickAdapterIcon } from './icons.js';

interface AdapterRowProps {
  adapter: Adapter;
  selected: boolean;
  onSelect: (id: string) => void;
}

function AdapterRow({ adapter, selected, onSelect }: AdapterRowProps) {
  const iconKey = pickAdapterIcon(adapter.description);
  const Icon = Icons[iconKey];
  const ipv4 = adapter.ipv4;
  const ipv4Display =
    ipv4.address && ipv4.prefixLength != null
      ? `${ipv4.address}/${ipv4.prefixLength}`
      : '—';
  return (
    <div
      className={`wn-adapter ${selected ? 'sel' : ''}`}
      onClick={() => onSelect(adapter.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(adapter.id);
        }
      }}
    >
      <span className="ic">{typeof Icon === 'function' ? <Icon /> : null}</span>
      <div>
        <div className="meta1">
          {adapter.windowsAlias}
          {adapter.appAlias ? <span className="alias">{adapter.appAlias}</span> : null}
        </div>
        <div className="meta2 num">{adapter.macAddress}</div>
      </div>
      <div className="right">
        <div className="ipv4 num">{ipv4Display}</div>
        <div className="link">
          <i /> {ipv4.mode.toUpperCase()} · link {adapter.linkState}
        </div>
      </div>
    </div>
  );
}

interface Props {
  adapters: Adapter[];
  profiles: Profile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  refreshSeconds?: number;
  lastRefreshLabel?: string;
}

export function LeftPane({
  adapters,
  profiles,
  selectedId,
  onSelect,
  refreshSeconds = 0.02,
  lastRefreshLabel,
}: Props) {
  return (
    <aside className="wn-left">
      <div className="wn-section-head">
        <span className="title">Adapters</span>
        <span className="meta num">
          {adapters.length} found · {refreshSeconds.toFixed(2)} s
        </span>
      </div>
      <div className="wn-refresh-row">
        {/* Refresh wires in Phase E2 (adapter selection + provider re-list).
            For frame 1 the button is visible but disabled — silently dead
            controls confuse users; explicit disabled communicates inertness. */}
        <button type="button" disabled title="Refresh wires in Phase E2">
          <Icons.refresh /> Refresh
        </button>
        {lastRefreshLabel ? <span className="ago">{lastRefreshLabel}</span> : null}
      </div>
      <div className="wn-adapters">
        {adapters.map((a) => (
          <AdapterRow
            key={a.id}
            adapter={a}
            selected={selectedId === a.id}
            onSelect={onSelect}
          />
        ))}
      </div>

      <div className="wn-profiles">
        <div className="wn-section-head">
          <span className="title">Profiles</span>
          <span className="meta">
            {profiles.length === 0 ? '—' : `${profiles.length} saved`}
          </span>
        </div>
        {profiles.length === 0 ? (
          <div className="wn-empty">
            <div className="em-title">No profiles saved yet.</div>
            Select an adapter and click <b>Save profile</b> to capture its IPv4 configuration
            for re-use.
            <div className="em-cta">
              <Icons.arrowRight /> Start with an adapter above
            </div>
          </div>
        ) : (
          <div className="list">
            {profiles.map((p) => (
              <div key={p.id} className="wn-profile">
                <div>
                  <div className="pname">{p.name}</div>
                  <div className="pmeta num">
                    {p.ipv4.mode === 'static' && p.ipv4.address && p.ipv4.prefixLength != null
                      ? `${p.ipv4.address}/${p.ipv4.prefixLength}`
                      : 'DHCP'}
                  </div>
                </div>
                <div className="ptag">{p.preferredAdapter?.windowsAliasAtSaveTime ?? '—'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
