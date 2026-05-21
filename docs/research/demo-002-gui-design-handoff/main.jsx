// Mount the design canvas with all WinNetPro demo-002 frames.

const W = 1200, H = 800;

function Canvas() {
  return (
    <DesignCanvas>
      <DCSection id="primary"
        title="WinNetPro · demo-002 GUI"
        subtitle="The two highest-information frames: first launch, and the central edit surface (Static mode) with the live change plan. Theme toggle lives top-right of each window.">
        <DCArtboard id="frame-1" label="1 · First launch · no adapter, no profiles" width={W} height={H}>
          <Frame1FirstLaunch/>
        </DCArtboard>
        <DCArtboard id="frame-3" label="3 · Static mode mid-edit · live change plan · pending" width={W} height={H}>
          <Frame3Static/>
        </DCArtboard>
      </DCSection>

      <DCSection id="states"
        title="States · DHCP, validation error, modal"
        subtitle="The rest of the screens called for by §11 acceptance criteria.">
        <DCArtboard id="frame-2" label="2 · DHCP selected · Static fields hidden (improvement on NetSwitch §4a)" width={W} height={H}>
          <Frame2Dhcp/>
        </DCArtboard>
        <DCArtboard id="frame-4" label="4 · Validation error · invalid IPv4" width={W} height={H}>
          <Frame4Validation/>
        </DCArtboard>
        <DCArtboard id="frame-5" label="5 · Save profile modal" width={W} height={H}>
          <Frame5SaveModal/>
        </DCArtboard>
      </DCSection>

      <DCSection id="dark"
        title="Dark theme"
        subtitle="Same frames, dark theme as initial state. Toggle in each window's title bar (sun ↔ moon) flips themes live. Both themes share the same token contract — only values change.">
        <DCArtboard id="frame-1d" label="1 · First launch · dark" width={W} height={H}>
          <Frame1FirstLaunch theme="dark"/>
        </DCArtboard>
        <DCArtboard id="frame-3d" label="3 · Static mid-edit · dark" width={W} height={H}>
          <Frame3Static theme="dark"/>
        </DCArtboard>
        <DCArtboard id="frame-2d" label="2 · DHCP selected · dark" width={W} height={H}>
          <Frame2Dhcp theme="dark"/>
        </DCArtboard>
        <DCArtboard id="frame-4d" label="4 · Validation error · dark" width={W} height={H}>
          <Frame4Validation theme="dark"/>
        </DCArtboard>
        <DCArtboard id="frame-5d" label="5 · Save modal · dark" width={W} height={H}>
          <Frame5SaveModal theme="dark"/>
        </DCArtboard>
      </DCSection>

      <DCSection id="future"
        title="Demo-003 preview · the future shape"
        subtitle="Optional per §11 — shows Apply enabled, banner re-keyed to warn, applied state. Light + dark.">
        <DCArtboard id="frame-6"  label="6 · Real provider · Apply enabled · light" width={W} height={H}>
          <Frame6Demo003/>
        </DCArtboard>
        <DCArtboard id="frame-6d" label="6 · Real provider · Apply enabled · dark"  width={W} height={H}>
          <Frame6Demo003 theme="dark"/>
        </DCArtboard>
      </DCSection>

      <DCSection id="tokens"
        title="Design tokens"
        subtitle="Colors, type, spacing, radii, state-chip — the agent implements off these cards. Dark mirror confirms every token has a paired value.">
        <DCArtboard id="frame-7"  label="7 · Tokens · light" width={W} height={H}>
          <Frame7Tokens/>
        </DCArtboard>
        <DCArtboard id="frame-7d" label="7 · Tokens · dark"  width={W} height={H}>
          <Frame7Tokens theme="dark"/>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Canvas/>);
