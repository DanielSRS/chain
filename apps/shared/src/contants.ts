export const LOG_SERVER_HOST = process.env['LOG_SERVER_HOST'] ?? '127.0.0.1';
export const LOG_SERVER_PORT = +(process.env['LOG_SERVER_PORT'] ?? 3519);
export const LOG_PATH = process.env['LOG_PATH'] ?? '/__log__remote__';
export const LOG_SERVER = `${LOG_SERVER_HOST}:${LOG_SERVER_PORT}`;
