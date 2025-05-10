import { ErrorCode } from './error-code.js';

/** Objeto que identifica um erro */
export interface CoreError<T> {
  /** Codigo de erro. Idendifica um erro */
  readonly code: ErrorCode;
  /** Mensagem brevemente descritiva sobre o erro */
  readonly message: string;
  /** Lista mensagens mais especificas sobre o erro */
  readonly erros: Array<string>;
  /** Informação detalhada do erro */
  readonly details: T;
}

/** https://stackoverflow.com/questions/32807163/call-constructor-on-typescript-class-without-new */
interface CoreErrorConstructor {
  new <T>(params: CoreError<T>): CoreError<T>; // newable
  <T>(params: CoreError<T>): CoreError<T>; // callable
}

/** https://stackoverflow.com/questions/42999983/typescript-removing-readonly-modifier */
type Writeable<T> = { -readonly [K in keyof T]: T[K] };

export const CoreError = function <Y>(
  this: CoreError<Y> | void,
  params: CoreError<Y>,
) {
  if (!(this instanceof CoreError)) {
    return new CoreError(params);
  }

  const self = this as Writeable<typeof this>;

  /** Constructor */
  self.code = params.code;
  self.details = params.details;
  self.erros = params.erros;
  self.message = params.message;
  this.toString = function () {
    return `Error: ${this.code} - ${this.message}`;
  };
  return this;
} as CoreErrorConstructor;
