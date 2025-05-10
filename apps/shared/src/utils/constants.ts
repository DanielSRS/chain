export const FLEX1 = { flexBasis: 0, flexGrow: 1, flexShrink: 1 } as const;
export const SERVER_HOST = process.env['SERVER_HOST'] ?? 'localhost'; //server IP
export const SERVER_PORT = +(process.env['SERVER_PORT'] ?? 8080); // server port
