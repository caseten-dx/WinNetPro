// FakeProvider — default per ADR-0002. Reads adapter state from a JSON
// fixture; never touches the OS. Mutation log exists (for future write paths
// + the BDD assertion "the fake provider mutation log is empty") but is not
// written to in demo-002's read-only surface; demo-003 wires it up.

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { Adapter } from '../domain/types.js';
import type { NetworkProvider } from '../application/ports.js';

export interface FakeProviderOptions {
  fixtureDir: string;
}

export interface MutationLogEntry {
  at: string;
  adapterId: string;
  action: string;
}

export class FakeProvider implements NetworkProvider {
  readonly kind = 'fake' as const;
  readonly mutationLog: MutationLogEntry[] = [];

  constructor(private readonly options: FakeProviderOptions) {}

  async listAdapters(): Promise<Adapter[]> {
    const path = resolve(this.options.fixtureDir, 'adapters.json');
    const raw = await readFile(path, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error(`fixture at ${path} is not a JSON array`);
    }
    return parsed as Adapter[];
  }
}
