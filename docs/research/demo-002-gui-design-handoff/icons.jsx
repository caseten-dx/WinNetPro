// Inline SVG icons used across the WinNetPro shell.
// All icons stroke 1.5, currentColor.
const Icon = ({ d, size = 16, stroke = 1.5, fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
       strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
    {typeof d === 'string' ? <path d={d}/> : d}
  </svg>
);

const I = {
  refresh:  <Icon d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"/>,
  ethernet: <Icon d={<><rect x="3" y="9" width="18" height="11" rx="2"/><path d="M7 13v3M10 13v3M14 13v3M17 13v3M8 9V6m4 3V4m4 5V6"/></>}/>,
  wifi:     <Icon d={<><path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8.5 16a5.5 5.5 0 0 1 7 0"/><circle cx="12" cy="19" r="1" fill="currentColor"/></>}/>,
  usb:      <Icon d={<><path d="M12 21V4"/><circle cx="12" cy="3" r="1.2" fill="currentColor"/><path d="M12 15l-4-2.5V9"/><path d="M8 9h-2v-2h4v2H8z"/><path d="M12 12l4-2v-1l1.5-1.5L19 10l-1.5 1.5L16 10l-4 2z"/></>}/>,
  selectArrow: <Icon d="M9 18l6-6-6-6"/>,
  empty:    <Icon d={<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18"/></>}/>,
  shield:   <Icon d={<><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z"/><path d="M9 12l2 2 4-4"/></>}/>,
  shieldSmall: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  ),
  caret:    <Icon d="M6 9l6 6 6-6"/>,
  bolt:     <Icon d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>,
  info:     <Icon d={<><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></>}/>,
  alert:    <Icon d={<><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></>}/>,
  inspect:  <Icon d={<><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/></>}/>,
  plus:     <Icon d="M12 5v14M5 12h14"/>,
  check:    <Icon d="M5 12l5 5L20 7"/>,
  lock:     <Icon d={<><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/></>}/>,
  arrowRight: <Icon d="M5 12h14M13 6l6 6-6 6"/>,
};

// Tiny helper for inline glyphs that need a specific size
const IconAt = ({ name, size = 16 }) => React.cloneElement(I[name], { size });

window.I = I;
window.IconAt = IconAt;
