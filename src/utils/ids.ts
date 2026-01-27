// ids.ts
import { customAlphabet } from "nanoid";

const BASE58 =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz" as const;

/** Single source of truth */
export const config = {
  // Core entities
  tenant: {
    prefix: "tnt_",
    length: 10,
    regex: /^tnt_[1-9A-HJ-NP-Za-km-z]{10}$/,
  },
  settings: {
    prefix: "set_",
    length: 10,
    regex: /^set_[1-9A-HJ-NP-Za-km-z]{10}$/,
  },

  // Identity model
  principal: {
    prefix: "prin_",
    length: 16,
    regex: /^prin_[1-9A-HJ-NP-Za-km-z]{16}$/,
  },
  pinCredential: {
    prefix: "pincred_",
    length: 12,
    regex: /^pincred_[1-9A-HJ-NP-Za-km-z]{12}$/,
  },
  passwordCredential: {
    prefix: "pwdcred_",
    length: 12,
    regex: /^pwdcred_[1-9A-HJ-NP-Za-km-z]{12}$/,
  },
  oauthCredential: {
    prefix: "oauthcred_",
    length: 12,
    regex: /^oauthcred_[1-9A-HJ-NP-Za-km-z]{12}$/,
  },
  apiKeyCredential: {
    prefix: "apicred_",
    length: 12,
    regex: /^apicred_[1-9A-HJ-NP-Za-km-z]{12}$/,
  },
  roleGrant: {
    prefix: "rg_",
    length: 16,
    regex: /^rg_[1-9A-HJ-NP-Za-km-z]{16}$/,
  },

  // Menu entities
  category: {
    prefix: "cat_",
    length: 10,
    regex: /^cat_[1-9A-HJ-NP-Za-km-z]{10}$/,
  },
  allergen: {
    prefix: "alg_",
    length: 10,
    regex: /^alg_[1-9A-HJ-NP-Za-km-z]{10}$/,
  },
  menuItem: {
    prefix: "mnu_",
    length: 12,
    regex: /^mnu_[1-9A-HJ-NP-Za-km-z]{12}$/,
  },

  // Operational entities
  table: {
    prefix: "tbl_",
    length: 10,
    regex: /^tbl_[1-9A-HJ-NP-Za-km-z]{10}$/,
  },
  tab: { prefix: "tab_", length: 10, regex: /^tab_[1-9A-HJ-NP-Za-km-z]{10}$/ },
  item: { prefix: "itm_", length: 12, regex: /^itm_[1-9A-HJ-NP-Za-km-z]{12}$/ },
  tabItem: {
    prefix: "ttm_",
    length: 12,
    regex: /^ttm_[1-9A-HJ-NP-Za-km-z]{12}$/,
  },
  payment: {
    prefix: "pay_",
    length: 11,
    regex: /^pay_[1-9A-HJ-NP-Za-km-z]{11}$/,
  },

  // Utility
  temp: { prefix: "", length: 8, regex: /^[1-9A-HJ-NP-Za-km-z]{8}$/ },
} as const;

export type ResourceType = keyof typeof config;

/** Utility: turn a prefix into the corresponding string type */
type Prefixed<S extends string> = S extends "" ? string : `${S}${string}`;

/** Auto-generated map: { table: "tbl_${string}", temp: string, ... } */
type IdMap = { [K in ResourceType]: Prefixed<(typeof config)[K]["prefix"]> };

/** Generic: IdOf<'tab'> → "tab_${string}" (or string for empty prefix) */
export type IdOf<T extends ResourceType> = IdMap[T];

/* ----------------- runtime ----------------- */

const factories: Record<number, () => string> = {};
const getFactory = (len: number): (() => string) => {
  if (!factories[len]) {
    factories[len] = customAlphabet(BASE58, len);
  }
  return factories[len];
};

export function generateId<T extends ResourceType>(type: T): IdOf<T> {
  const { prefix, length } = config[type];
  return (prefix + getFactory(length)()) as IdOf<T>;
}

export const isId = <T extends ResourceType>(
  type: T,
  value: string,
): value is IdOf<T> => config[type].regex.test(value);

export const assertId = <T extends ResourceType>(
  type: T,
  value: string,
): IdOf<T> => {
  if (!isId(type, value)) throw new Error(`Invalid ${type} id: "${value}"`);
  return value;
};
