import { storageService } from '../../../shared/index.js';

export const userStorage = storageService.withInstanceID('user').initialize();
