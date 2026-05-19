// Domain types mirror `docs/specs/profile-schema.md`. Pure TS, no OS imports.

export type IPv4Mode = 'static' | 'dhcp';
export type IPv6ProfileMode = 'inherit';
export type IPv6AdapterMode = 'static' | 'auto' | 'disabled' | 'unknown';
export type DnsProfileMode = 'inherit' | 'dhcp' | 'static';
export type LinkState = 'up' | 'down' | 'disconnected' | 'unknown';
export type MatchConfidence = 'exact' | 'mac' | 'description' | 'alias' | 'global';

export interface AdapterIpv4 {
  mode: IPv4Mode;
  address: string | null;
  prefixLength: number | null;
  gateway: string | null;
  dns: { servers: string[] };
}

export interface AdapterIpv6Address {
  address: string;
  prefixLength: number;
  kind: 'link-local' | 'global' | 'unique-local' | 'unknown';
}

export interface AdapterIpv6 {
  mode: IPv6AdapterMode;
  addresses: AdapterIpv6Address[];
  gateway: string | null;
  dns: { servers: string[] };
}

export interface Adapter {
  id: string;
  interfaceGuid: string;
  windowsAlias: string;
  description: string;
  macAddress: string;
  appAlias: string | null;
  linkState: LinkState;
  ipv4: AdapterIpv4;
  ipv6: AdapterIpv6;
  lastAppliedProfileId: string | null;
}

export interface PreferredAdapter {
  macAddress?: string;
  interfaceGuid?: string;
  interfaceDescription?: string;
  windowsAliasAtSaveTime?: string;
}

export interface ProfileIpv4 {
  mode: IPv4Mode;
  address: string | null;
  prefixLength: number | null;
  gateway: string | null;
  dns: { mode: DnsProfileMode; servers: string[] };
}

export interface Profile {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  preferredAdapter?: PreferredAdapter;
  ipv4: ProfileIpv4;
  ipv6: { mode: IPv6ProfileMode };
  rollback: { enabled: boolean };
}

export interface ChangePlanIpv4Section {
  from: {
    mode: IPv4Mode;
    address: string | null;
    prefixLength: number | null;
    gateway: string | null;
  };
  to: {
    mode: IPv4Mode;
    address: string | null;
    prefixLength: number | null;
    gateway: string | null;
  };
  willChange: boolean;
}

export interface ChangePlan {
  kind: 'ChangePlan';
  createdAt: string;
  sourceProfileId: string;
  targetAdapterId: string;
  match: { confidence: MatchConfidence; criteria: string[] };
  ipv4: ChangePlanIpv4Section;
  dns: { from: string[]; to: string[]; willChange: boolean; reason: string };
  ipv6: { willChange: false; reason: string };
  rollback: { snapshotWillBeCreated: boolean; snapshotPath: string };
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] };

export type MatchResult =
  | { kind: 'matched'; adapter: Adapter; confidence: MatchConfidence; criteria: string[] }
  | { kind: 'ambiguous'; candidates: Adapter[]; criterion: MatchConfidence }
  | { kind: 'no-match'; reason: string };
