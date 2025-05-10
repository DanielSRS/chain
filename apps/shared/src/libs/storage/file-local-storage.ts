/* eslint-disable @typescript-eslint/no-explicit-any */
import { LocalStorage } from 'node-localstorage';
import type { StorageInstance } from './StorageInstance.js';
import type { StorageLoader } from './storage-loader.js';
import { Logger } from '../../utils/utils.js';

const DATABASE_DIR = './db';
const localStorage = new LocalStorage(DATABASE_DIR);

const log = Logger.extend('file-local-storage');

/**
 * Encoded storage keys
 */

const instanceIDs = 'instanceIDs';
const instanceKeys = 'instanceKeys';

const ALL_EVENT_KEY_TO_SUB = '::_sub-to-all_::';

const safeParse = (val: string | null) => {
  if (!val) {
    return null;
  }
  try {
    return JSON.parse(val) as unknown;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return null;
  }
};

const registryInstanceID = (id: string) => {
  const instance_ids = safeParse(localStorage.getItem(instanceIDs));

  // nenhuma instancia registrada ainda
  if (instance_ids === null) {
    const newRegistry = [id, instanceIDs];
    localStorage.setItem(instanceIDs, JSON.stringify(newRegistry));
    return;
  }

  // data retrieved is something unknow
  if (typeof instance_ids !== 'object') {
    log.error('storage is corrupted - o');
    return;
  }

  if (!Array.isArray(instance_ids)) {
    log.error('storage is corrupted - a');
    return;
  }

  const alreadyRegistred = (instance_ids as string[]).includes(id);

  if (alreadyRegistred) {
    return;
  }

  instance_ids.push(id);
  localStorage.setItem(instanceIDs, JSON.stringify(instance_ids));
};

const getInstanceKeys = (id: string) => {
  const keysID = `${id}${instanceKeys}`;
  const keysList = safeParse(localStorage.getItem(keysID));

  // não tem keys registradas nessa instancia ainda
  if (!Array.isArray(keysList)) {
    const newkeys = [keysID];
    localStorage.setItem(keysID, JSON.stringify(newkeys));
    return new Set(newkeys);
  }

  return new Set(keysList as string[]);
};

interface WebStorageProps {
  instanceID: string;
}
interface StorageInstanceEvent<T> {
  type: 'UPDATED' | 'DELETED';
  newValue: T;
  key: string;
}

class WebStorage implements StorageInstance {
  private instanceID: string;
  private listners: Record<
    string,
    Set<(e: StorageInstanceEvent<any>) => void> | undefined
  >;
  private instanceKeys: Set<string>;

  private registryKey(key: string) {
    const keysID = `${this.instanceID}${instanceKeys}`;
    const alreadyDid = this.instanceKeys.has(key);
    if (alreadyDid) {
      return;
    }

    this.instanceKeys.add(key);
    const newList = [...this.instanceKeys.values()];
    localStorage.setItem(keysID, JSON.stringify(newList));
  }

  private removeKey(key: string) {
    const keysID = `${this.instanceID}${instanceKeys}`;
    const alreadyDid = this.instanceKeys.has(key);
    if (!alreadyDid) {
      return;
    }

    this.instanceKeys.delete(key);
    const newList = [...this.instanceKeys.values()];
    localStorage.setItem(keysID, JSON.stringify(newList));
  }

  constructor(props?: WebStorageProps) {
    const { instanceID = 'default' } = props || {};
    this.instanceID = instanceID;
    registryInstanceID(this.instanceID);
    this.instanceKeys = getInstanceKeys(this.instanceID);
    this.listners = {};
  }

  private notifyListners<T, R>(
    eventType: StorageInstanceEvent<T>['type'],
    key: string,
    value: T,
    propagate: R,
  ) {
    const listnersGroup = this.listners[key];
    const listnersGroupAll = this.listners[ALL_EVENT_KEY_TO_SUB];
    if (!listnersGroup && !listnersGroupAll) {
      return propagate;
    }

    const event = { key: key, type: eventType, newValue: value };

    listnersGroup?.values().forEach(handler => handler(event));
    listnersGroupAll?.values().forEach(handler => handler(event));

    return propagate;
  }

  private notifyUpdate<T, R>(key: string, value: T, propagate: R) {
    return this.notifyListners('UPDATED', key, value, propagate);
  }

  private notifyExclusion<T, R>(key: string, value: T, propagate: R) {
    return this.notifyListners('DELETED', key, value, propagate);
  }

  private removeListener(key: string, value: any) {
    // console.log('reve listenesr from', key);
    const listnersGroup = this.listners[key];
    if (!listnersGroup) {
      // console.log('there is no listners in key: ', key);
      return;
    }
    const removed = listnersGroup.delete(value);
    if (removed) {
      // console.log('listener removed from', key);
    } else {
      // console.log('listener not found', key);
    }
    // console.log('left in the group', listnersGroup.size);
  }

  subscribe<T>(
    key: string,
    eventHandler: (event: StorageInstanceEvent<T>) => void,
  ) {
    // console.log('subscribing to', key);
    // get initial value
    const getInitialVelue = async () => {
      // console.log(`getting initial value of ${key} in ${this.instanceID} db`);
      return this.getStringAsync(key)
        .then(a => {
          // console.log('The value: ', a);
          try {
            const parsed = JSON.parse(a as any);
            return parsed as T;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (e) {
            return a as any;
          }
        })
        .catch(() => undefined);
    };
    const listnersGroup = this.listners[key];
    if (listnersGroup) {
      listnersGroup.add(eventHandler);
    } else {
      this.listners[key] = new Set([eventHandler]);
    }

    return {
      unsubscribe: () => this.removeListener(key, eventHandler),
      getInitialVelue,
    };
  }

  subscribeToAll(
    eventHandler: (event: StorageInstanceEvent<Map<string, unknown>>) => void,
  ) {
    // console.log('subscribing to', key);
    // get initial value
    const getInitialVelue = async () => {
      // console.log(`getting initial value of ${key} in ${this.instanceID} db`);
      const keys = await this.getKeys();
      // logger.debug('Instance keys: ', keys);
      const HH = new Map<string, unknown>();
      // logger.warn('START');
      for (const key of keys) {
        const t = await this.getStringAsync(key)
          .then(a => {
            // console.log('The value: ', a);
            try {
              const parsed: unknown = JSON.parse(a as any);
              // logger.info('getInitialVelue - parse with key: ', key);
              return parsed;
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
              // logger.error('getInitialVelue - failed to parse with key: ', key);
              return a as unknown;
            }
          })
          .catch(() => undefined);
        // logger.debug('to be set: ', t);
        HH.set(key, t);
      }
      return HH;
    };
    const listnersGroup = this.listners[ALL_EVENT_KEY_TO_SUB];
    if (listnersGroup) {
      listnersGroup.add(eventHandler);
    } else {
      this.listners[ALL_EVENT_KEY_TO_SUB] = new Set([eventHandler]);
    }

    return {
      unsubscribe: () =>
        this.removeListener(ALL_EVENT_KEY_TO_SUB, eventHandler),
      getInitialVelue,
    };
  }

  private useKeyWithInstance(key: string) {
    return `${this.instanceID}${key}`;
  }

  setMapAsync(key: string, value: object): Promise<boolean> {
    return new Promise(resolve => {
      const id = this.useKeyWithInstance(key);
      this.registryKey(id);
      localStorage.setItem(id, JSON.stringify(value));
      resolve(this.notifyUpdate(key, value, true));
    });
  }
  setStringAsync(
    key: string,
    value: string,
  ): Promise<boolean | null | undefined> {
    return new Promise(resolve => {
      const id = this.useKeyWithInstance(key);
      this.registryKey(id);
      localStorage.setItem(id, value);
      resolve(this.notifyUpdate(key, value, true));
    });
  }
  setBoolAsync(
    key: string,
    value: boolean,
  ): Promise<boolean | null | undefined> {
    return new Promise(resolve => {
      const id = this.useKeyWithInstance(key);
      this.registryKey(id);
      localStorage.setItem(id, JSON.stringify(value));
      resolve(this.notifyUpdate(key, value, true));
    });
  }
  removeItemAsync(key: string): Promise<void> {
    const id = this.useKeyWithInstance(key);
    this.removeKey(id);
    localStorage.removeItem(id);
    return this.notifyExclusion(key, undefined, Promise.resolve());
  }
  getStringAsync(key: string): Promise<string | null | undefined> {
    return new Promise((resolve, reject) => {
      const id = this.useKeyWithInstance(key);
      const res = localStorage.getItem(id);
      if (typeof res === 'string' || res === null) {
        return resolve(res ?? undefined);
      }
      reject(null);
    });
  }
  getMapAsync<T>(key: string): Promise<T | null | undefined> {
    return new Promise(resolve => {
      const id = this.useKeyWithInstance(key);
      const res = safeParse(localStorage.getItem(id));
      if (typeof res === 'object') {
        resolve(res as T | null);
      }
      resolve(undefined);
    });
  }
  getBoolAsync(key: string): Promise<boolean | null | undefined> {
    return new Promise(resolve => {
      const id = this.useKeyWithInstance(key);
      const res = safeParse(localStorage.getItem(id));
      if (res === null) {
        resolve(undefined);
      }
      resolve(Boolean(res));
    });
  }
  setArrayAsync(
    key: string,
    value: any[],
  ): Promise<boolean | null | undefined> {
    return new Promise(resolve => {
      const id = this.useKeyWithInstance(key);
      this.registryKey(id);
      localStorage.setItem(id, JSON.stringify(value));
      resolve(this.notifyUpdate(key, value, true));
    });
  }
  getArrayAsync<T>(key: string): Promise<T[] | null | undefined> {
    return new Promise(resolve => {
      const id = this.useKeyWithInstance(key);

      const res = safeParse(localStorage.getItem(id));
      if (Array.isArray(res)) {
        resolve(res);
      }
      resolve(undefined);
    });
  }

  async clearStorage() {
    localStorage.clear();
  }

  async getKeys() {
    const kk = `${this.instanceID}${instanceKeys}`;
    const f = this.instanceKeys
      .values()
      .toArray()
      .map(k => {
        if (k === kk) {
          return '';
        }
        return k.replace(this.instanceID, '');
      })
      .filter(k => k !== '');
    // logger.info('getKeys - filtered: ', f);
    return f;
  }
}

class WebStorageLoader implements StorageLoader {
  private instanceId: string;
  // private encrypted: boolean;

  constructor() {
    this.instanceId = 'default';
    // this.encrypted = false;
  }

  withInstanceID(id: string): this {
    this.instanceId = id;
    return this;
  }

  withEncryption(): this {
    // this.encrypted = true;
    return this;
  }

  initialize(): StorageInstance {
    return new WebStorage({ instanceID: this.instanceId });
  }
}

export const Storage = WebStorageLoader;
