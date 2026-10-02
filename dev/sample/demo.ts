// TypeScript tour. TODO: shown as a todo
/**
 * JSDoc block. Loads a user by id.
 * @param id - the user id
 */
import { readFile } from 'node:fs/promises';
import type { Metadata } from 'next';

export enum Role { Admin = 'admin', User = 'user' }
export const enum Flag { Off = 0, On = 1 }

interface User<T extends object = {}> {
  readonly id: number;
  name?: string;
  type: Role;
  meta: Record<string, unknown> & T;
}

type Key = keyof User;
type Maybe<T> = T extends null | undefined ? never : T;

const big = 1_000_000n + 0xff + 0b1010 + 0o17 + 1.5e-3 + .5;
const ratio = total / count / 2;
const slug = /^[a-z0-9-]+$/i;
const quote = /["'`]/g;
const path = '/api/users/' + "id\t\"quoted\"";
const url = `https://x.io/${user.id}/${fn({ a: 1 })}`;

abstract class Store<T> implements Iterable<T> {
  static count = 0;
  constructor(private readonly items: T[] = []) {}
  get size(): number { return this.items.length; }
  *[Symbol.iterator]() { yield* this.items; }
}

function* ids(): Generator<number> { let i = 0; while (true) yield i++; }

export async function load(id: string): Promise<User | null> {
  const raw = await readFile(`./users/${id}.json`, 'utf8');
  const data = JSON.parse(raw) satisfies User;
  switch (data.type) {
    case Role.Admin: return data;
    default:
      return null;
  }
}

const double = (n: number): number => n * 2;
const greet = async ({ name }: User) => `hi ${name}`;
const inc = x => x + 1;
const cache = new Map<Key, User>();
cache.get('id'); module.exports = { default: load };
