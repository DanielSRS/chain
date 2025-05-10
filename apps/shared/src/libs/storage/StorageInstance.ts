export interface StorageInstance {
  /**
   * Set an Object to storage for the given key.
   *
   * Note that this function does **not** work with the Map data type.
   *
   */
  setMapAsync(key: string, value: object): Promise<boolean | null | undefined>;
  /**
   * Set a string value to storage for the given key.
   */
  setStringAsync(
    key: string,
    value: string,
  ): Promise<boolean | null | undefined>;
  /**
   * Set a boolean value to storage for the given key.
   *
   */
  setBoolAsync(
    key: string,
    value: boolean,
  ): Promise<boolean | null | undefined>;
  /**
   * Remove an item from storage for a given key.
   *
   */
  removeItemAsync(key: string): Promise<void>;
  /**
   * Get the string value for the given key.
   */
  getStringAsync(key: string): Promise<string | null | undefined>;
  /**
   * Get then Object from storage for the given key.
   */
  getMapAsync<T>(key: string): Promise<T | null | undefined>;
  /**
   * Get the boolean value for the given key.
   */
  getBoolAsync(key: string): Promise<boolean | null | undefined>;
  /**
   * Set an array to storage for the given key.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setArrayAsync(key: string, value: any[]): Promise<boolean | null | undefined>;
  /**
   * Get the array from the storage for the given key.
   */
  getArrayAsync<T>(key: string): Promise<T[] | null | undefined>;

  /** Registra para escutar eventos que alteram algum valor associado a key informada. Retorna funç~~ao para deisncrever */
  subscribe<T>(
    key: string,
    eventHandler: (event: { type: 'UPDATED' | 'DELETED'; newValue: T }) => void,
  ): {
    unsubscribe: () => void;
    getInitialVelue: () => Promise<T | undefined>;
  };
  subscribeToAll(
    eventHandler: (event: {
      type: 'UPDATED' | 'DELETED';
      newValue: unknown;
      key: string;
    }) => void,
  ): {
    unsubscribe: () => void;
    getInitialVelue: () => Promise<Map<string, unknown>>;
  };
  /**
   * Clear all data in the db
   */
  clearStorage: () => Promise<void>;
  getKeys: () => Promise<Array<string>>;
}
