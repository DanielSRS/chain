import { observable } from '@legendapp/state';
import type {
  Car,
  Station,
  Request,
  Position,
  Charge,
} from '../../../shared/src/utils/main.types.js';
import { SERVER_HOST, SERVER_PORT } from '../constants.js';
import { tcpRequest } from '../../../shared/index.js';
import { Logger } from '../../../shared/index.js';
import { userStorage } from './persisted.js';
import { apiClient } from '../../../shared/src/api/client.js';

/**
 * User key for local storage
 */
const USER_KEY = 'user';
/**
 * Indica se o usuário foi deletado. Existe apenas
 * para evitar situações de concorrência onde o usuário
 * é deletado do storage, mas um evento de atualização
 * ainda é recebido e faz o usuário ser guardado novamente
 * no storage de forma corrompida.
 */
let IS_USER_DELETED = false;

export const SharedData = observable<{
  /**
   * Usuário registrado
   *
   * undefined indica que a informação ainda não foi carregada
   * null indica que o usuário não está registrado
   */
  car: Car | null | undefined;
  selectedStation: Station;
  // getSuggestions: () => void;
  suggestions: Station[];
  reservedStation: Station;
  chargingCar: Charge;
  charges: Charge[];
}>();

/**
 * Observa alterações nas informações do usuário salvas
 * no armazenamento local e atualiza o estado compartilhado
 */
const userStorageObserver = userStorage.subscribe<Car>(USER_KEY, event => {
  if (event.type === 'DELETED') {
    SharedData.car.set(null);
    return;
  }
  SharedData.car.set(event.newValue);
});
userStorageObserver.getInitialVelue().then(v => SharedData.car.set(v ?? null));

export const saveUserToStorage = (user: Car) => {
  if (IS_USER_DELETED) {
    Logger.error('User was deleted from storage');
    return;
  }
  userStorage.setMapAsync(USER_KEY, user);
};

export async function getSuggestions(
  location: Position,
  onResult: (d: Station[]) => void,
) {
  const res = await tcpRequest(
    {
      type: 'getSuggestions',
      data: {
        id: SharedData.car.peek()?.id ?? -1,
        location: location,
      },
    } satisfies Request,
    SERVER_HOST,
    SERVER_PORT,
  );
  if (res.type === 'success') {
    // log.info('Suggestions: ', res.data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onResult((res.data as any).data as Station[]);
    return;
  }
  // log.error('Error: ', res.message, res.error);
}

export function saveNewUser(user: Car) {
  IS_USER_DELETED = false;
  saveUserToStorage(user);
}

export function deleteUser() {
  IS_USER_DELETED = true;
  userStorage.removeItemAsync(USER_KEY);
}

export async function getCharges(onResult: (d: Charge[]) => void) {
  const res = await apiClient({
    type: 'rechargeList',
    data: {
      userId: SharedData.car.peek()?.id ?? -1,
    },
  });
  if (res.type !== 'success') {
    Logger.error('getCharges tcp Error: ', res);
    return;
  }
  // Logger.info('getCharges: ', res.data);
  if (!res.data.success) {
    Logger.error('getCharges response error: ', res);
    if (
      typeof res.data.error === 'object' &&
      res.data.error.code === 'USER_NOT_FOUND'
    ) {
      Logger.error('Server lost user data??', res.data);
      // Log user out
      deleteUser();
      return;
    }
    return;
  }
  onResult(res.data.data);
}
