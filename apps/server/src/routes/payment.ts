import { curry } from '../utils/curry.ts';
import {
  ERROR_CODES,
  type ChargeRecord,
  type RequestHandler,
  type UserGroup,
} from '../utils/types.ts';
type Handler = RequestHandler<'payment'>;

/**
 * Se o cliente existe
 * Se a recarga existe
 * Se a recarga é desse cliente
 * Faz o pagamento
 */
export const payment = curry(
  (
    users: UserGroup,
    chargeGroup: ChargeRecord,
    data: Handler['data'],
  ): Handler['res'] => {
    const { userId, chargeId } = data;

    const user = users[userId];
    if (!user) {
      return {
        message: 'ERROR: User does not exist',
        success: false,
        error: ERROR_CODES.USER_NOT_FOUND,
      };
    }

    const recharge = Object.values(chargeGroup).find(
      recharge => recharge.chargeId === chargeId && recharge.userId === userId,
    );

    if (!recharge) {
      return {
        message: 'Recharge not found or does not belong to the user.',
        success: false,
        error: 'The payment has been canceled.',
      };
    }

    if (recharge.hasPaid) {
      return {
        message: 'WARNING: This recharge has already been paid.',
        success: false,
        error: 'It was not possible to pay this recharge receipt',
      };
    }

    recharge.hasPaid = true;

    return {
      message: 'Payment processed successfully.',
      success: true,
      data: recharge,
    };
  },
);
