// FRAME 7 — Tokens & system card
function Frame7Tokens({ theme = 'light' } = {}) {
  const colors = [
    ['Surface · canvas',   'var(--wn-bg)',        'wn-bg',        'oklch(98.6% 0.005 75)'],
    ['Surface · card',     'var(--wn-surface)',   'wn-surface',   '#ffffff'],
    ['Surface · sunken',   'var(--wn-surface-2)', 'wn-surface-2', 'oklch(96.5% 0.006 75)'],
    ['Surface · plan',     'var(--wn-surface-3)', 'wn-surface-3', 'oklch(94.5% 0.007 75)'],
    ['Ink · primary',      'var(--wn-ink)',       'wn-ink',       'oklch(22% 0.012 60)'],
    ['Ink · secondary',    'var(--wn-ink-2)',     'wn-ink-2',     'oklch(40% 0.010 60)'],
    ['Border',             'var(--wn-border)',    'wn-border',    'oklch(89% 0.006 70)'],
    ['Divider',            'var(--wn-divider)',   'wn-divider',   'oklch(92% 0.005 70)'],
  ];
  const accents = [
    ['Accent',         'var(--wn-accent)',      'wn-accent',      'oklch(58% 0.10 200)'],
    ['Safe (banner)',  'var(--wn-safe)',        'wn-safe',        'oklch(55% 0.13 152)'],
    ['Warn (pending)', 'var(--wn-warn)',        'wn-warn',        'oklch(70% 0.13 75)'],
    ['Danger',         'var(--wn-danger)',      'wn-danger',      'oklch(58% 0.18 28)'],
  ];
  const types = [
    ['display',  '22 / 600',  'Adapter detail title'],
    ['lg',       '16 / 600',  'Empty-state heading & modal title'],
    ['md',       '14 / 500',  'Body, inputs, button labels'],
    ['sm',       '13 / 500',  'Form labels, plan rows'],
    ['xs',       '12 / 500',  'Hints, status, captions'],
    ['2xs',      '11 / 600',  'Section labels (uppercase)'],
  ];
  const spacing = [
    ['s-2', 4],['s-3', 6],['s-4', 8],['s-5', 12],['s-6', 16],
    ['s-7', 20],['s-8', 24],['s-9', 32],['s-10', 40],['s-12', 56]
  ];
  return (
    <div className="tokens-card wn" data-theme={theme}>
      <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:8}}>
        <h1 style={{margin:0}}>Design tokens</h1>
        <span className="mono" style={{fontSize:11, color:'var(--wn-ink-3)'}}>
          theme: <b style={{color:'var(--wn-ink-2)'}}>{theme}</b> · swap via <span style={{color:'var(--wn-accent-ink)'}}>[data-theme]</span>
        </span>
      </div>
      <div className="sub">
        WinNetPro demo-002 · single source of truth in <span className="mono">tokens.css</span>.
        These are the only values the agent should reference when implementing.
      </div>

      <h2>Surfaces &amp; ink</h2>
      <div className="tokens-grid">
        {colors.map(([name, val, vname, hex]) => (
          <div key={vname} className="swatch">
            <div className="chip" style={{background:val}}/>
            <div className="name">{name}</div>
            <div className="var">--{vname}</div>
            <div className="mono" style={{fontSize:10, color:'var(--wn-ink-3)'}}>{hex}</div>
          </div>
        ))}
      </div>

      <h2>Semantic accents</h2>
      <div className="tokens-grid">
        {accents.map(([name, val, vname, hex]) => (
          <div key={vname} className="swatch">
            <div className="chip" style={{background:val}}/>
            <div className="name">{name}</div>
            <div className="var">--{vname}</div>
            <div className="mono" style={{fontSize:10, color:'var(--wn-ink-3)'}}>{hex}</div>
          </div>
        ))}
      </div>
      <p style={{fontSize:12, color:'var(--wn-ink-3)', marginTop:8, lineHeight:1.5}}>
        <b>Color discipline.</b> The accent (teal) is for interactive affordance only.
        Green is reserved for safe-state messaging. Amber means pending-edit. Red is
        validation and (in demo-003) destructive paths. Never decorate with color —
        every coloured surface in this design means something.
      </p>

      <h2>Type ramp · Inter + JetBrains Mono</h2>
      <div>
        {types.map(([k, spec, label]) => {
          const sizes = {display:'22px', lg:'16px', md:'14px', sm:'13px', xs:'12px', '2xs':'11px'};
          return (
            <div key={k} className="type-row">
              <span className="label">--text-{k}</span>
              <span className="preview" style={{
                fontSize: sizes[k],
                fontWeight: spec.includes('600') ? 600 : (spec.includes('500') ? 500 : 400),
                textTransform: k === '2xs' ? 'uppercase' : 'none',
                letterSpacing: k === '2xs' ? '.07em' : 'normal',
              }}>{label}</span>
              <span className="spec">{spec}</span>
            </div>
          );
        })}
        <div className="type-row">
          <span className="label">mono</span>
          <span className="preview mono num" style={{fontSize:13}}>192.168.132.10/24 · 00-11-22-33-44-55</span>
          <span className="spec">tabular · zero-slashed</span>
        </div>
      </div>

      <h2>Spacing scale</h2>
      <div>
        {spacing.map(([name, px]) => (
          <div key={name} className="scale-row">
            <span className="name">--{name}</span>
            <span className="bar" style={{width:px}}/>
            <span className="val">{px} px</span>
          </div>
        ))}
      </div>

      <h2>Radii &amp; elevation</h2>
      <div style={{display:'flex', gap:16, flexWrap:'wrap'}}>
        {[3,5,7,10,14].map((r, i) => (
          <div key={r} style={{
            width:96, height:64, background:'#fff',
            border:'1px solid var(--wn-border)',
            borderRadius:r,
            boxShadow: i === 4 ? 'var(--wn-shadow-3)' : (i >= 2 ? 'var(--wn-shadow-2)' : 'var(--wn-shadow-1)'),
            display:'flex',alignItems:'center',justifyContent:'center',
            fontFamily:'var(--wn-font-mono)', fontSize:11, color:'var(--wn-ink-3)'}}>
            r-{i+1} · {r}px
          </div>
        ))}
      </div>

      <h2>State machine chip</h2>
      <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
        <span className="wn-status idle"><i/>idle</span>
        <span className="wn-status pending"><i/>pending</span>
        <span className="wn-status applied"><i/>applied</span>
        <span className="wn-status failed"><i/>failed: validation</span>
        <span className="wn-status failed" style={{
          background:'oklch(95% 0.02 28)',
          color:'oklch(40% 0.13 28)'
        }}><i style={{background:'oklch(58% 0.18 28)'}}/>rolled-back</span>
      </div>
      <p style={{fontSize:12, color:'var(--wn-ink-3)', marginTop:12, lineHeight:1.5}}>
        Demo-002 only exercises <span className="mono">idle / pending / applied / failed</span>.
        <span className="mono"> applying</span> and <span className="mono">rolled-back</span> reserve
        their visual slot so demo-003 doesn't need a redesign.
      </p>
    </div>
  );
}
window.Frame7Tokens = Frame7Tokens;
