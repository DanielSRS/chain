import { curry } from '../utils/curry.ts';
import {
  ERROR_CODES,
  type ChargeRecord,
  type RequestHandler,
  type Station,
  type StationGroup,
  type UserGroup,
} from '../utils/types.ts';

// ------

// Finalizar recarga
// Se o posto exite
// Se o cliente exite
// O posto deve estar recarregando um carro
// O id do carro deve ser o mesmo do Charge

// Muda o status da estção
//   - para disponível se não houver mais reservas
//   - para reservado se ainda houver reservas na fila
// Finalizar o Charge (salvar end time)
// retornar o Charge para o usuário

type Handler = RequestHandler<'endCharging'>;

export const endCharging = curry(
  (
    stations: StationGroup,
    users: UserGroup,
    chargeGroup: ChargeRecord,
    data: Handler['data'],
  ): Handler['res'] => {
    const { stationId, userId, battery_level } = data;
    const station = stations[stationId];
    if (!station) {
      return {
        message: 'Station does not exist',
        success: false,
        error: 'this field is required',
      };
    }

    const user = users[userId];
    if (!user) {
      return {
        message: 'User does not exist',
        success: false,
        error: ERROR_CODES.USER_NOT_FOUND,
      };
    }

    if (station.state !== 'charging-car') {
      return {
        message:
          'There is no car recharging now, so impossible to complete a recharge',
        success: false,
        error: 'Station is not at the charging-car state',
      };
    }

    if (station.onUse === -1) {
      return {
        message:
          'Because of a strange, absurd and  unknown reason, there is no recharge receipt associated with this station',
        success: false,
        error: 'No recharge receipt at this station',
      };
    }

    const charge = chargeGroup[station.onUse];

    if (!charge) {
      return {
        message: 'Recharge receipt does not exist',
        success: false,
        error: 'this field is not optional',
      };
    }

    if (charge.userId !== userId) {
      return {
        message: 'This recharge receipt refers to another car',
        success: false,
        error: 'This receipt recharge is associated with another user',
      };
    }

    const endDate = new Date();

    charge.endTime = endDate;

    charge.cost = battery_level * 6.02 - charge.cost;
    // Deixar typescript feliz depois

    releaseStation(station);
    station.onUse = -1;

    return {
      message: 'Recharging has been succesfully completed',
      success: true,
      data: charge,
    };
  },
);

function releaseStation(station: Station) {
  station.state = station.reservations.length === 0 ? 'avaliable' : 'reserved';
}
