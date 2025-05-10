import { StorageInstance } from './instance.js';

export interface StorageLoader {
  /**
   * Load storage with the specified ID. If instance does not exist, a new instance will be created.
   */
  withInstanceID(id: string): this;
  /**
   * Encrypt storage Instance and store the creditials in secured storage for later use.
   * The key for encryption is automatically generated and the default alias for key storage is 'com.MMKV.ammarahmed' which is converted to HEX for usage.
   *
   * Requires an ID to be specified.
   *
   */
  withEncryption(): this;
  /**
   * Create the instance with the given options.
   */
  initialize(): StorageInstance;
}
