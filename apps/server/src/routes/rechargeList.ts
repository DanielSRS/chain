import { curry } from '../utils/curry';
import { Logger } from '../utils/logger';
import {
  ERROR_CODES,
  type ChargeRecord,
  type RequestHandler,
  type UserGroup,
} from '../utils/types';

type Handler = RequestHandler<'rechargeList'>;

/**
 * Retorna a lista de recibos de recargas associados a um user
 * Se o cliente existe
 */
export const rechargeList = curry(
  (
    users: UserGroup,
    chargeGroup: ChargeRecord,
    data: Handler['data'],
  ): Handler['res'] => {
    const { userId } = data;

    const user = users[userId];
    if (!user) {
      return {
        message: 'ERROR: User does not exist',
        success: false,
        error: ERROR_CODES.USER_NOT_FOUND,
      };
    }

    const recharge_list = Object.values(chargeGroup).filter(
      charge => charge.userId === user.id,
    );

    Logger.debug('What is the value??: ', recharge_list);

    if (recharge_list.length === 0) {
      return {
        message:
          'WARNING: There is no recharge receipt associated with the user!',
        success: true,
        data: recharge_list,
      };
    } else {
      return {
        message: 'Recharge receipt list!',
        success: true,
        data: recharge_list,
      };
    }
  },
);
