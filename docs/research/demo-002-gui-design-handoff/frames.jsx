// All WinNetPro demo-002 frame contents.
// Each exported function returns a <WnWindow> with the frame's content.

// ============================================================
// FRAME 1 — First launch (no adapter selected, no profiles)
// ============================================================
function Frame1FirstLaunch({ theme = "light" } = {}) {
  return (
    <WnWindow theme={theme} status="idle" statusMeta="Ready · select an adapter to begin">
      <WnLeftPane profiles={[]} selectedId={null}/>
      <main className="wn-right">
        <div className="wn-detail-empty">
          <div className="card">
            <div className="icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="9" width="18" height="11" rx="2"/>
                <path d="M7 13v3M10 13v3M14 13v3M17 13v3M8 9V6m4 3V4m4 5V6"/>
              </svg>
            </div>
            <h2>Select an adapter to view and edit its profile.</h2>
            <p>
              Three fixture adapters are listed on the left. Click any one to see
              its current IPv4 configuration and build a profile from it.
            </p>
            <div style={{
              marginTop:'var(--wn-s-7)',
              display:'flex',gap:'var(--wn-s-3)',
              justifyContent:'center', flexWrap:'wrap',
              fontSize:'var(--wn-text-xs)', color:'var(--wn-ink-3)'}}>
              <span className="wn-future-note" style={{borderStyle:'solid',background:'var(--wn-accent-soft)',borderColor:'var(--wn-accent-border)',color:'var(--wn-accent-ink)'}}>
                <span className="dot" style={{background:'var(--wn-accent)'}}/> Fixture provider · 3 adapters · 0 profiles
              </span>
            </div>
          </div>
        </div>
      </main>
    </WnWindow>
  );
}

// ============================================================
// FRAME 2 — Adapter selected, IPv4 mode = DHCP
//           Static fields HIDDEN (brief §4a improvement)
// ============================================================
function Frame2Dhcp({ theme = "light" } = {}) {
  const a = ADAPTERS[1]; // ad-02 — Dock Radio
  return (
    <WnWindow theme={theme} status="idle" statusMeta="Idle · no pending changes">
      <WnLeftPane profiles={[]} selectedId="ad-02"/>
      <main className="wn-right">
        <div className="wn-detail">
          <WnAdapterHeader a={a} alias="Dock Radio"/>
          <div className="wn-form">

            <div className="wn-fieldset">
              <div className="legend">
                <h3>IPv4</h3>
                <span className="hint">Live configuration · read from fixture provider</span>
              </div>
              <WnRow label="Mode">
                <WnSeg value="dhcp" options={[{value:'dhcp',label:'DHCP'},{value:'static',label:'Static'}]}/>
              </WnRow>
              <WnRow label="Assignment">
                <div style={{
                  display:'flex',alignItems:'center',gap:8,
                  fontSize:'var(--wn-text-sm)',color:'var(--wn-ink-2)',
                  padding:'8px 12px',
                  background:'var(--wn-surface-2)',
                  border:'1px solid var(--wn-border)',
                  borderRadius:'var(--wn-r-2)'}}>
                  <span style={{color:'var(--wn-ink-3)'}}>{I.info}</span>
                  IP address, prefix, and gateway will be assigned automatically.
                  Switch to <b>Static</b> to enter them by hand.
                </div>
              </WnRow>
              <WnRow label="Current lease">
                <span className="mono num" style={{fontSize:'var(--wn-text-sm)',color:'var(--wn-ink-2)'}}>
                  {a.ipv4.address}/{a.ipv4.prefixLength} · gw {a.ipv4.gateway}
                </span>
              </WnRow>
            </div>

            <div className="wn-fieldset">
              <div className="legend">
                <h3>DNS &amp; IPv6</h3>
                <span className="hint">Read-only in v1</span>
              </div>
              <WnRow label="DNS"><span className="wn-readonly">inherit (no change)</span></WnRow>
              <WnRow label="IPv6"><span className="wn-readonly">inherit (no change)</span></WnRow>
            </div>

            <div>
              <div style={{
                display:'flex',alignItems:'baseline',justifyContent:'space-between',
                marginBottom:'var(--wn-s-3)'}}>
                <span style={{
                  fontSize:'var(--wn-text-xs)',textTransform:'uppercase',
                  letterSpacing:'.07em',color:'var(--wn-ink-3)',fontWeight:600,whiteSpace:'nowrap'}}>
                  Pending change plan
                </span>
              </div>
              <div className="wn-plan">
                <div className="empty">
                  <div className="ic">{I.info}</div>
                  <div className="t">
                    <b>No pending changes.</b>
                    Edit a field above to preview the change plan. The plan mirrors
                    the CLI's <span className="mono">--json</span> output exactly.
                  </div>
                </div>
              </div>
            </div>

            <div className="wn-actions">
              <button className="wn-btn">Save profile</button>
              <button className="wn-btn primary" disabled>Apply</button>
              <WnFutureNote/>
              <div style={{marginLeft:'auto'}}><span className="wn-status idle"><i/>idle</span></div>
            </div>
          </div>
        </div>
      </main>
    </WnWindow>
  );
}

// ============================================================
// FRAME 3 — Adapter selected, Static mid-edit + live plan
// ============================================================
function Frame3Static({ theme = "light" } = {}) {
  const a = ADAPTERS[1];
  return (
    <WnWindow theme={theme} status="pending" statusMeta="Pending · 2 fields edited"
              statusTail={<span style={{color:'var(--wn-ink-3)'}}>last validate ✓ 11 ms</span>}>
      <WnLeftPane profiles={[]} selectedId="ad-02"/>
      <main className="wn-right">
        <div className="wn-detail">
          <WnAdapterHeader a={a} alias="Dock Radio"/>
          <div className="wn-form">

            <div className="wn-fieldset">
              <div className="legend">
                <h3>IPv4</h3>
                <span className="hint" style={{color:'var(--wn-warn-ink)'}}>● Editing</span>
              </div>
              <WnRow label="Mode">
                <WnSeg value="static" options={[{value:'dhcp',label:'DHCP'},{value:'static',label:'Static'}]}/>
              </WnRow>
              <WnRow label="Address">
                <div>
                  <input className="wn-input mono num" defaultValue="192.168.132.10"/>
                  <div className="wn-help">IPv4 dotted-quad. Tabular figures align with prefix below.</div>
                </div>
              </WnRow>
              <WnRow label="Prefix length">
                <div style={{display:'flex',gap:'var(--wn-s-3)',alignItems:'center'}}>
                  <input className="wn-input mono num" defaultValue="24" style={{width:80,textAlign:'right'}}/>
                  <span className="mono" style={{color:'var(--wn-ink-3)',whiteSpace:'nowrap'}}>= 255.255.255.0 · 254 hosts</span>
                </div>
              </WnRow>
              <WnRow label="Gateway">
                <div>
                  <input className="wn-input mono num" placeholder="optional" defaultValue=""/>
                  <div className="wn-help">Leave empty for an isolated subnet (e.g. dock radio).</div>
                </div>
              </WnRow>
            </div>

            <div className="wn-fieldset">
              <div className="legend">
                <h3>DNS &amp; IPv6</h3>
                <span className="hint">Read-only in v1</span>
              </div>
              <WnRow label="DNS"><span className="wn-readonly">inherit (no change)</span></WnRow>
              <WnRow label="IPv6"><span className="wn-readonly">inherit (no change)</span></WnRow>
            </div>

            <div>
              <div style={{
                display:'flex',alignItems:'baseline',justifyContent:'space-between',
                marginBottom:'var(--wn-s-3)'}}>
                <span style={{
                  fontSize:'var(--wn-text-xs)',textTransform:'uppercase',
                  letterSpacing:'.07em',color:'var(--wn-ink-3)',fontWeight:600,whiteSpace:'nowrap'}}>
                  Pending change plan
                </span>
                <span className="mono" style={{fontSize:'var(--wn-text-2xs)',color:'var(--wn-ink-3)',whiteSpace:'nowrap'}}>
                  recomputed 11 ms ago · match: exact (interfaceGuid)
                </span>
              </div>
              <div className="wn-plan">
                <div className="head">
                  <h3>2 changes</h3>
                  <span className="pulse"><i/> live</span>
                </div>
                <div className="body">
                  <div className="row">
                    <span className="k">IPv4</span>
                    <span className="v">
                      <span className="from">dhcp 192.168.1.42/24</span>
                      <span className="arrow">→</span>
                      <span className="to">static 192.168.132.10/24</span>
                    </span>
                  </div>
                  <div className="row">
                    <span className="k">Gateway</span>
                    <span className="v">
                      <span className="from">192.168.1.1</span>
                      <span className="arrow">→</span>
                      <span className="to">— (none)</span>
                    </span>
                  </div>
                  <div className="row nochange">
                    <span className="k">DNS</span>
                    <span className="v">no change <span style={{color:'var(--wn-ink-3)'}}>· profile DNS mode is inherit</span></span>
                  </div>
                  <div className="row nochange">
                    <span className="k">IPv6</span>
                    <span className="v">no change <span style={{color:'var(--wn-ink-3)'}}>· v1 does not mutate IPv6</span></span>
                  </div>
                  <div className="row nochange">
                    <span className="k">Rollback</span>
                    <span className="v">snapshot will be captured to <span style={{color:'var(--wn-ink-2)'}}>./snapshots/ad-02-…json</span></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="wn-actions">
              <button className="wn-btn primary">Save profile</button>
              <button className="wn-btn" disabled>Apply</button>
              <WnFutureNote/>
              <div style={{marginLeft:'auto'}}>
                <span className="wn-status pending"><i/>pending</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </WnWindow>
  );
}

// ============================================================
// FRAME 4 — Validation error (invalid IPv4)
// ============================================================
function Frame4Validation({ theme = "light" } = {}) {
  const a = ADAPTERS[1];
  return (
    <WnWindow theme={theme} status="failed" statusMeta="validation: invalid IPv4 address"
              statusTail={<a className="more">More</a>}>
      <WnLeftPane profiles={[]} selectedId="ad-02"/>
      <main className="wn-right">
        <div className="wn-detail">
          <WnAdapterHeader a={a} alias="Dock Radio"/>
          <div className="wn-form">

            <div className="wn-fieldset">
              <div className="legend">
                <h3>IPv4</h3>
                <span className="hint" style={{color:'var(--wn-danger-ink)'}}>● 1 error</span>
              </div>
              <WnRow label="Mode">
                <WnSeg value="static" options={[{value:'dhcp',label:'DHCP'},{value:'static',label:'Static'}]}/>
              </WnRow>
              <WnRow label="Address">
                <div>
                  <input className="wn-input mono num error" defaultValue="192.168.1.300"/>
                  <div className="wn-help error">
                    Not a valid IPv4 address. Each octet must be 0–255.
                  </div>
                </div>
              </WnRow>
              <WnRow label="Prefix length">
                <div style={{display:'flex',gap:'var(--wn-s-3)',alignItems:'center'}}>
                  <input className="wn-input mono num" defaultValue="24" style={{width:80,textAlign:'right'}}/>
                  <span className="mono" style={{color:'var(--wn-ink-3)'}}>= 255.255.255.0 · 254 hosts</span>
                </div>
              </WnRow>
              <WnRow label="Gateway">
                <input className="wn-input mono num" placeholder="optional"/>
              </WnRow>
            </div>

            <div>
              <div style={{
                display:'flex',alignItems:'baseline',justifyContent:'space-between',
                marginBottom:'var(--wn-s-3)'}}>
                <span style={{
                  fontSize:'var(--wn-text-xs)',textTransform:'uppercase',
                  letterSpacing:'.07em',color:'var(--wn-ink-3)',fontWeight:600,whiteSpace:'nowrap'}}>
                  Pending change plan
                </span>
              </div>
              <div className="wn-plan" style={{
                borderColor:'var(--wn-danger-border)',
                background:'var(--wn-danger-soft)'}}>
                <div className="empty">
                  <div className="ic" style={{
                    color:'var(--wn-danger-ink)',
                    borderColor:'var(--wn-danger-border)',
                    background:'rgba(255,255,255,.6)'}}>{I.alert}</div>
                  <div className="t">
                    <b style={{color:'var(--wn-danger-ink)'}}>
                      Plan blocked by validation.
                    </b>
                    Fix the highlighted field above to recompute the change plan.
                    Nothing has been saved or applied.
                  </div>
                </div>
              </div>
            </div>

            <div className="wn-actions">
              <button className="wn-btn" disabled>Save profile</button>
              <button className="wn-btn" disabled>Apply</button>
              <WnFutureNote/>
              <div style={{marginLeft:'auto'}}>
                <span className="wn-status failed"><i/>failed: validation</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </WnWindow>
  );
}

// ============================================================
// FRAME 5 — Save Profile modal (overlaid on static-edit screen)
// ============================================================
function Frame5SaveModal({ theme = "light" } = {}) {
  const a = ADAPTERS[1];
  return (
    <WnWindow theme={theme} status="pending" statusMeta="Save profile…">
      <WnLeftPane profiles={[]} selectedId="ad-02"/>
      <main className="wn-right">
        <div className="wn-detail" style={{filter:'blur(0.5px) saturate(0.85)', opacity:.55}}>
          <WnAdapterHeader a={a} alias="Dock Radio"/>
          <div className="wn-form">
            <div className="wn-fieldset">
              <div className="legend"><h3>IPv4</h3></div>
              <WnRow label="Mode">
                <WnSeg value="static" options={[{value:'dhcp',label:'DHCP'},{value:'static',label:'Static'}]}/>
              </WnRow>
              <WnRow label="Address"><input className="wn-input mono num" defaultValue="192.168.132.10"/></WnRow>
              <WnRow label="Prefix"><input className="wn-input mono num" defaultValue="24" style={{width:80}}/></WnRow>
            </div>
          </div>
        </div>

        <div className="wn-modal-scrim">
          <div className="wn-modal">
            <div className="head">
              <h2>Save profile</h2>
              <p className="subtitle">
                Captures the current IPv4 configuration. The profile can be re-applied
                later from any adapter.
              </p>
            </div>
            <div className="body">
              <div className="field">
                <label htmlFor="pname">Name</label>
                <input id="pname" className="wn-input" defaultValue="DOCK 132" autoFocus/>
                <span className="hint">Stored as <span className="mono">profile-dock-132</span> · ID is immutable after creation.</span>
              </div>
              <div className="field">
                <label htmlFor="pdesc">Description <span style={{color:'var(--wn-ink-3)',fontWeight:400}}>(optional)</span></label>
                <input id="pdesc" className="wn-input" defaultValue="Static profile for dock radio 132"/>
              </div>
              <label className="check">
                <input type="checkbox" defaultChecked/>
                <div>
                  <div className="ck-title">Capture preferred adapter</div>
                  <div className="ck-desc">
                    Records MAC, GUID, and description for future matching.
                    Uncheck for a globally-applicable profile.
                  </div>
                  <div style={{
                    marginTop:8, padding:'6px 8px',
                    background:'var(--wn-surface-2)', border:'1px solid var(--wn-border)',
                    borderRadius:'var(--wn-r-2)',
                    fontFamily:'var(--wn-font-mono)', fontSize:'var(--wn-text-2xs)',
                    color:'var(--wn-ink-2)'}}>
                    MAC <b>{a.macAddress}</b> · GUID <b>{a.interfaceGuid}</b>
                  </div>
                </div>
              </label>
            </div>
            <div className="foot">
              <button className="wn-btn">Cancel</button>
              <button className="wn-btn primary">{I.check} Save</button>
            </div>
          </div>
        </div>
      </main>
    </WnWindow>
  );
}

// ============================================================
// FRAME 6 — Demo-003 preview (Apply enabled, future shape)
// ============================================================
function Frame6Demo003({ theme = "light" } = {}) {
  const a = ADAPTERS[1];
  const profiles = [
    { name:'DOCK 132',    ipv4:'static 192.168.132.10/24', adapter:'ad-02'},
    { name:'Office DHCP', ipv4:'dhcp',                     adapter:'global'},
    { name:'Lab-static',  ipv4:'static 10.0.0.50/24',      adapter:'ad-01'},
  ];
  return (
    <WnWindow theme={theme} banner="real-ready"
              status="applied"
              statusMeta="Applied profile DOCK 132 · verify ✓ · snapshot ad-02-…json">
      <WnLeftPane profiles={profiles} selectedId="ad-02"/>
      <main className="wn-right">
        <div className="wn-detail">
          <WnAdapterHeader a={{...a, ipv4: {mode:'static', address:'192.168.132.10', prefixLength:24, gateway:null}}} alias="Dock Radio"/>
          <div className="wn-form">

            <div className="wn-fieldset">
              <div className="legend">
                <h3>IPv4</h3>
                <span className="hint" style={{color:'var(--wn-safe-ink)'}}>● Applied 412 ms ago</span>
              </div>
              <WnRow label="Mode">
                <WnSeg value="static" options={[{value:'dhcp',label:'DHCP'},{value:'static',label:'Static'}]}/>
              </WnRow>
              <WnRow label="Address"><input className="wn-input mono num" defaultValue="192.168.132.10"/></WnRow>
              <WnRow label="Prefix">
                <input className="wn-input mono num" defaultValue="24" style={{width:80,textAlign:'right'}}/>
              </WnRow>
              <WnRow label="Gateway"><input className="wn-input mono num" placeholder="optional"/></WnRow>
            </div>

            <div>
              <div style={{
                display:'flex',alignItems:'baseline',justifyContent:'space-between',
                marginBottom:'var(--wn-s-3)'}}>
                <span style={{
                  fontSize:'var(--wn-text-xs)',textTransform:'uppercase',
                  letterSpacing:'.07em',color:'var(--wn-ink-3)',fontWeight:600,whiteSpace:'nowrap'}}>
                  Last apply
                </span>
                <span className="mono" style={{fontSize:'var(--wn-text-2xs)',color:'var(--wn-ink-3)'}}>
                  outcome: applied · elapsed 412 ms · provider: powershell
                </span>
              </div>
              <div className="wn-plan" style={{borderColor:'var(--wn-safe-border)',background:'var(--wn-safe-soft)'}}>
                <div className="head" style={{borderBottomColor:'var(--wn-safe-border)'}}>
                  <h3>
                    <span style={{display:'inline-flex',alignItems:'center',gap:6,color:'var(--wn-safe-ink)'}}>
                      {I.check} Applied · verified
                    </span>
                  </h3>
                  <span className="pulse" style={{color:'var(--wn-safe-ink)'}}>
                    <i style={{background:'var(--wn-safe)',animation:'none'}}/> rollback armed
                  </span>
                </div>
                <div className="body">
                  <div className="row"><span className="k">IPv4</span>
                    <span className="v">
                      <span className="from">dhcp 192.168.1.42/24</span>
                      <span className="arrow">→</span>
                      <span className="to">static 192.168.132.10/24</span>
                    </span>
                  </div>
                  <div className="row nochange"><span className="k">Verify</span>
                    <span className="v">state matches plan · diff: null</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="wn-actions">
              <button className="wn-btn">Save profile</button>
              <button className="wn-btn primary">Apply</button>
              <button className="wn-btn danger-ghost">{I.refresh} Revert to DHCP</button>
              <div style={{marginLeft:'auto'}}>
                <span className="wn-status applied"><i/>applied</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </WnWindow>
  );
}

Object.assign(window, {
  Frame1FirstLaunch, Frame2Dhcp, Frame3Static,
  Frame4Validation, Frame5SaveModal, Frame6Demo003,
});
