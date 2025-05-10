import { Storage } from './file-local-storage.js';
import { StorageLoader } from './storage-loader.js';

export const storageService: StorageLoader = new Storage();
