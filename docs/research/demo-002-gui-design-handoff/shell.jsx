// Shared WinNetPro window chrome + reusable subcomponents.
// Every artboard wraps its content in <WnWindow ...>.

// ---------- adapter fixture (the 3 from the brief) ----------
const ADAPTERS = [
  {
    id: 'ad-01',
    icon: 'ethernet',
    windowsAlias: 'Ethernet',
    description: 'Intel(R) Ethernet Connection I219-LM',
    macAddress: 'AA-BB-CC-00-00-01',
    appAlias: null,
    linkState: 'up',
    ipv4: { mode: 'dhcp', address: '10.10.20.57', prefixLength: 22, gateway: '10.10.20.1' },
    interfaceGuid: '{11111111-1111-1111-1111-111111111111}',
  },
  {
    id: 'ad-02',
    icon: 'usb',
    windowsAlias: 'Ethernet 5',
    description: 'USB 10/100/1000 LAN',
    macAddress: '00-11-22-33-44-55',
    appAlias: 'Dock Radio',
    linkState: 'up',
    ipv4: { mode: 'dhcp', address: '192.168.1.42', prefixLength: 24, gateway: '192.168.1.1' },
    interfaceGuid: '{a1b2c3d4-1234-5678-9abc-def012345678}',
  },
  {
    id: 'ad-03',
    icon: 'wifi',
    windowsAlias: 'Wi-Fi',
    description: 'Intel(R) Wi-Fi 6 AX201 160MHz',
    macAddress: 'AA-BB-CC-00-00-03',
    appAlias: null,
    linkState: 'up',
    ipv4: { mode: 'dhcp', address: '10.10.30.118', prefixLength: 22, gateway: '10.10.30.1' },
    interfaceGuid: '{33333333-3333-3333-3333-333333333333}',
  },
];

// ---------- Window chrome ----------
function WnThemeToggle({ theme, onChange }) {
  // Two-state segmented toggle: sun · moon.
  return (
    <button
      type="button"
      onClick={() => onChange(theme === 'dark' ? 'light' : 'dark')}
      title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      style={{
        display:'inline-flex', alignItems:'center', gap:0,
        background:'var(--wn-surface)', border:'1px solid var(--wn-border)',
        borderRadius:999, padding:2, cursor:'pointer',
        color:'var(--wn-ink-2)',
      }}>
      <span aria-hidden="true" style={{
        width:20, height:20, borderRadius:'50%',
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        background: theme === 'light' ? 'var(--wn-accent-soft)' : 'transparent',
        color: theme === 'light' ? 'var(--wn-accent-ink)' : 'var(--wn-ink-3)',
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
        </svg>
      </span>
      <span aria-hidden="true" style={{
        width:20, height:20, borderRadius:'50%',
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        background: theme === 'dark' ? 'var(--wn-accent-soft)' : 'transparent',
        color: theme === 'dark' ? 'var(--wn-accent-ink)' : 'var(--wn-ink-3)',
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>
        </svg>
      </span>
    </button>
  );
}

function WnTitleBar({ theme, onThemeChange }) {
  return (
    <div className="wn-titlebar">
      <div className="tb-left">
        <span className="tb-app-glyph">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7h16M4 12h16M4 17h10"/>
          </svg>
        </span>
        <span className="tb-title">WinNetPro</span>
        <span className="tb-sep">·</span>
        <span className="mono">demo-002</span>
        <span className="tb-sep">·</span>
        <span>fixture provider</span>
      </div>
      <div className="tb-center">
        <span className="mono" style={{color:'var(--wn-ink-3)'}}>
          C:\Users\mike\winnetpro\demo-002
        </span>
      </div>
      <div className="tb-right">
        <span className="wn-toggle" title="Auto-apply is OFF — toggle disabled in demo-002">
          <span style={{opacity:.6}}>Auto-apply</span>
          <span className="sw"/>
        </span>
        <WnThemeToggle theme={theme} onChange={onThemeChange}/>
      </div>
      <div className="wn-caption">
        <button title="Minimise" aria-label="Minimise">
          <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M0 5 H10"/>
          </svg>
        </button>
        <button title="Maximise" aria-label="Maximise">
          <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="0.5" y="0.5" width="9" height="9"/>
          </svg>
        </button>
        <button className="close" title="Close" aria-label="Close">
          <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M0 0 L10 10 M10 0 L0 10"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

function WnSafeBanner({ variant = 'safe' }) {
  // variant: 'safe' (demo-002 default), 'real-ready' (future demo-003 preview)
  if (variant === 'real-ready') {
    return (
      <div className="wn-safe-banner" style={{
        background:'var(--wn-warn-soft)',
        borderBottomColor:'var(--wn-warn-border)',
        color:'var(--wn-warn-ink)'}}>
        <span style={{position:'absolute',left:0,top:0,bottom:0,width:3,background:'var(--wn-warn)'}}/>
        <span className="badge" style={{background:'var(--wn-warn)'}}>
          {I.shieldSmall} Real provider · arm to mutate
        </span>
        <span className="why">
          Apply <b>will modify</b> Windows network state. Snapshots and rollback are armed.
        </span>
        <span className="demo-pill" style={{borderColor:'var(--wn-warn-border)'}}>demo-003 preview</span>
      </div>
    );
  }
  return (
    <div className="wn-safe-banner">
      <span className="badge">{I.shieldSmall} Safe mode</span>
      <span className="why">
        Fixture provider — <b>no</b> real network changes can occur in this demo.
        Real apply lands in demo-003.
      </span>
      <span className="demo-pill">demo-002</span>
    </div>
  );
}

function WnStatusBar({ status = 'idle', meta = 'Ready', tail = null }) {
  return (
    <div className="wn-statusbar">
      <div className="lhs">
        <span className={`wn-status ${status}`}><i/>{status}</span>
        <span style={{color:'var(--wn-ink-3)'}}>·</span>
        <span>{meta}</span>
      </div>
      <div className="rhs">
        {tail}
        <span className="more">Show log</span>
      </div>
    </div>
  );
}

// ---------- Adapter list (left pane) ----------
function WnAdapterRow({ a, selected, onClick }) {
  const ipv4 = a.ipv4.mode === 'dhcp'
    ? `${a.ipv4.address}/${a.ipv4.prefixLength}`
    : `${a.ipv4.address}/${a.ipv4.prefixLength}`;
  return (
    <div className={`wn-adapter ${selected ? 'sel' : ''}`} onClick={onClick}>
      <span className="ic">{I[a.icon]}</span>
      <div>
        <div className="meta1">
          {a.windowsAlias}
          {a.appAlias && <span className="alias">{a.appAlias}</span>}
        </div>
        <div className="meta2 num">{a.macAddress}</div>
      </div>
      <div className="right">
        <div className="ipv4 num">{ipv4}</div>
        <div className="link">
          <i/> {a.ipv4.mode.toUpperCase()} · link {a.linkState}
        </div>
      </div>
    </div>
  );
}

function WnLeftPane({ selectedId, onSelect, profiles = [] }) {
  return (
    <aside className="wn-left">
      <div className="wn-section-head">
        <span className="title">Adapters</span>
        <span className="meta num">3 found · 0.02 s</span>
      </div>
      <div className="wn-refresh-row">
        <button>{I.refresh} Refresh</button>
        <span className="ago">Last refresh 2:50:34 PM</span>
      </div>
      <div className="wn-adapters">
        {ADAPTERS.map(a =>
          <WnAdapterRow key={a.id} a={a}
            selected={selectedId === a.id}
            onClick={() => onSelect && onSelect(a.id)}/>
        )}
      </div>

      <div className="wn-profiles">
        <div className="wn-section-head">
          <span className="title">Profiles</span>
          <span className="meta">{profiles.length === 0 ? '—' : `${profiles.length} saved`}</span>
        </div>
        {profiles.length === 0
          ? <div className="wn-empty">
              <div className="em-title">No profiles saved yet.</div>
              Select an adapter and click <b>Save profile</b> to capture
              its IPv4 configuration for re-use.
              <div className="em-cta">{I.arrowRight} Start with an adapter above</div>
            </div>
          : <div className="list">
              {profiles.map((p, i) => (
                <div key={i} className="wn-profile">
                  <div>
                    <div className="pname">{p.name}</div>
                    <div className="pmeta num">{p.ipv4}</div>
                  </div>
                  <div className="ptag">{p.adapter}</div>
                </div>
              ))}
            </div>
        }
      </div>
    </aside>
  );
}

// ---------- Detail subcomponents ----------
function WnAdapterHeader({ a, alias, onAliasChange }) {
  return (
    <div className="wn-adapter-head">
      <div>
        <h1>
          <span className="link-dot"/> {a.windowsAlias}
        </h1>
        <div className="desc">{a.description}</div>
        <div className="ids">
          <span className="k">MAC</span>     <span className="v">{a.macAddress}</span>
          <span className="k">GUID</span>    <span className="v">{a.interfaceGuid}</span>
          <span className="k">Adapter ID</span><span className="v">{a.id}</span>
          <span className="k">Link state</span><span className="v" style={{color:'var(--wn-link-state-up)',fontWeight:600}}>up</span>
        </div>
      </div>
      <div style={{minWidth:230, flex:'0 0 auto'}}>
        <div style={{fontSize:'var(--wn-text-2xs)',textTransform:'uppercase',letterSpacing:'.06em',color:'var(--wn-ink-3)',fontWeight:500,marginBottom:6, whiteSpace:'nowrap'}}>
          App alias <span style={{textTransform:'none',letterSpacing:0,color:'var(--wn-ink-4)',fontStyle:'italic',fontWeight:400,marginLeft:6}}>internal</span>
        </div>
        <input className="wn-input" defaultValue={alias ?? ''}
          placeholder="Add an internal alias…"/>
        <div style={{fontSize:'var(--wn-text-2xs)', color:'var(--wn-ink-3)', marginTop:6}}>
          Never written to Windows.
        </div>
      </div>
    </div>
  );
}

function WnRow({ label, children }) {
  return (
    <div className="wn-row">
      <span className="label">{label}</span>
      <div>{children}</div>
    </div>
  );
}

function WnSeg({ value, onChange, options }) {
  return (
    <div className="wn-seg">
      {options.map(o =>
        <button key={o.value}
          className={value === o.value ? 'on' : ''}
          onClick={() => onChange && onChange(o.value)}>{o.label}</button>
      )}
    </div>
  );
}

function WnFutureNote() {
  return (
    <span className="wn-future-note">
      <span className="dot"/> Apply lands in demo-003
    </span>
  );
}

// ---------- The WnWindow shell ----------
function WnWindow({ children, banner = 'safe', status = 'idle', statusMeta = 'Ready', statusTail = null, style, theme: themeProp = 'light' }) {
  // Each window owns its own theme so the toggle in the titlebar is live.
  const [theme, setTheme] = React.useState(themeProp);
  return (
    <div className="wn wn-window" data-theme={theme} style={style}>
      <WnTitleBar theme={theme} onThemeChange={setTheme}/>
      <WnSafeBanner variant={banner}/>
      <div className="wn-body">{children}</div>
      <WnStatusBar status={status} meta={statusMeta} tail={statusTail}/>
    </div>
  );
}

// Expose to other Babel files
Object.assign(window, {
  ADAPTERS,
  WnWindow, WnLeftPane, WnAdapterHeader, WnRow, WnSeg, WnFutureNote, WnSafeBanner,
});
