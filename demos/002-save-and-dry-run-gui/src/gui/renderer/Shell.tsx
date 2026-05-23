// The WnWindow chrome wrapper. Mirrors the hand-off's shell.jsx WnWindow.
// Sets data-theme on the window root so all token swaps take effect; renders
// title bar + safe banner above the body slot, status bar below.
//
// Children fill the .wn-body grid (380px left rail + 1fr right pane).

import type { ReactNode } from 'react';
import { TitleBar, type Theme } from './TitleBar.js';
import { SafeBanner, type SafeBannerVariant } from './SafeBanner.js';
import { StatusBar, type Status } from './StatusBar.js';

interface Props {
  theme: Theme;
  onThemeChange: (next: Theme) => void;
  bannerVariant?: SafeBannerVariant;
  status?: Status;
  statusMeta?: string;
  statusTail?: ReactNode;
  titleCenterText?: string;
  children: ReactNode;
}

export function Shell({
  theme,
  onThemeChange,
  bannerVariant = 'safe',
  status = 'idle',
  statusMeta = 'Ready',
  statusTail = null,
  titleCenterText,
  children,
}: Props) {
  return (
    <div className="wn-window" data-theme={theme}>
      <TitleBar theme={theme} onThemeChange={onThemeChange} centerText={titleCenterText} />
      <SafeBanner variant={bannerVariant} />
      <div className="wn-body">{children}</div>
      <StatusBar status={status} meta={statusMeta} tail={statusTail} />
    </div>
  );
}
