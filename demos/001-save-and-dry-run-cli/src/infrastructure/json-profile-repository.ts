// JsonProfileRepository — ADR-0003 locates profiles.json under the configured
// config-dir (defaults to CWD). Loads on demand; writes the full array on save.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import type { Profile } from '../domain/types.js';
import type { ProfileRepository } from '../application/ports.js';

export class JsonProfileRepository implements ProfileRepository {
  constructor(private readonly configDir: string) {}

  private path(): string {
    return resolve(this.configDir, 'profiles.json');
  }

  async loadAll(): Promise<Profile[]> {
    const p = this.path();
    if (!existsSync(p)) return [];
    const raw = await readFile(p, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error(`${p} is not a JSON array`);
    }
    return parsed as Profile[];
  }

  async findByName(name: string): Promise<Profile | null> {
    const all = await this.loadAll();
    return all.find((p) => p.name === name) ?? null;
  }

  async save(profile: Profile): Promise<void> {
    const all = await this.loadAll();
    const idx = all.findIndex((p) => p.name === profile.name);
    if (idx >= 0) {
      all[idx] = profile;
    } else {
      all.push(profile);
    }
    const p = this.path();
    await mkdir(dirname(p), { recursive: true });
    await writeFile(p, JSON.stringify(all, null, 2) + '\n', 'utf8');
  }
}
