import * as net from 'node:net';
import { Logger } from './utils/logger';
import { createRouter } from './routes/router';
import { reserve } from './routes/reserve';
import { getSuggestions } from './routes/stationSuggetions';
import { CHARGES, STATIONS, USERS } from './data/data';
import { registerStation } from './routes/registerStation';
import { registerUser } from './routes/registerCar';
import { startCharging } from './routes/startCharging';
import { endCharging } from './routes/endCharging';
import { rechargeList } from './routes/rechargeList';
import { getStationInfo } from './routes/getStationInfo';
import { payment } from './routes/payment';

const HOST = '0.0.0.0';
const PORT = 8080;
const MAX_RADIUS = 8000;

const log = Logger.extend('OLD_Server');
const server = net.createServer(socket => {
  log.info('Client connected:', socket.remoteAddress + ':' + socket.remotePort);

  socket.on('data', connection => {
    const router = createRouter()
      .add('reserve', reserve(STATIONS, USERS))
      .add('getSuggestions', getSuggestions(MAX_RADIUS, STATIONS))
      .add('registerStation', registerStation(STATIONS))
      .add('registerUser', registerUser(USERS))
      .add('startCharging', startCharging(STATIONS, USERS, CHARGES))
      .add('endCharging', endCharging(STATIONS, USERS, CHARGES))
      .add('rechargeList', rechargeList(USERS, CHARGES))
      .add('getStationInfo', getStationInfo(STATIONS))
      .add('payment', payment(USERS, CHARGES));

    const response = router.validateAndDispach(connection);

    // log.info(`Received: ${data}`);
    socket.write(JSON.stringify(response));
  });

  socket.on('end', () => {
    log.debug('Client disconnected');
  });

  socket.on('error', err => {
    log.error(`Socket error: ${err.message}`);
  });
});

server.listen(PORT, HOST, () => {
  log.info(`Server listening on ${HOST}:${PORT}`);
});

server.on('error', err => {
  log.error(`Server error: ${err.message}`);
});
