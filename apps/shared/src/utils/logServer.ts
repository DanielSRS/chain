/* eslint-disable no-console */
import * as http from 'node:http';
import { consoleTransport, logger } from 'react-native-logs';
import { LOG_PATH, LOG_SERVER_HOST, LOG_SERVER_PORT } from '../contants.js';

const log = logger.createLogger().extend('LogerServer');

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === LOG_PATH) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const jsonData = JSON.parse(body);
        res.statusCode = 200;
        // console.log(jsonData);
        consoleTransport(jsonData);
        res.setHeader('Content-Type', 'application/json');
        res.end('ok');
      } catch (err) {
        if (err) {
          //
        }
        res.statusCode = 400;
        console.log(400);
        res.setHeader('Content-Type', 'application/json');
        res.end('ok');
      }
    });
  } else {
    res.statusCode = 404;
    console.log({
      m: req.method,
      u: req.url,
      s: 404,
    });
    log.error('unknown request', {
      req,
    });
    res.setHeader('Content-Type', 'text/plain');
    res.end('Not Found\n');
  }
});

server.listen(LOG_SERVER_PORT, LOG_SERVER_HOST, () => {
  log.info(`Server running at ${LOG_SERVER_HOST}:${LOG_SERVER_PORT}/`);
});
