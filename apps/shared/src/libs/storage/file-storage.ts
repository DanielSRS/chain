/* eslint-disable no-async-promise-executor */
import fs from 'node:fs/promises';
import { CoreError } from './core-error.js';
import { ErrorCodes } from './error-code.js';
import { Either, left, right } from 'fp-ts/lib/Either.js';
import type { StorageLoader } from './loader.js';
import type { StorageInstance } from './instance.js';
import type { StorageReadingError, StorageWritingError } from './instance.js';

type SystemError = Error;

const DATABASE_DIR = 'database';

/** Cria uma função que cria erros de leitura do storage */
function readingErr(code: CoreError<unknown>['code'], expected: string) {
  return (val: unknown) =>
    left(
      CoreError({
        code: code,
        details: {
          expectedValue: expected,
          valueReceived: val,
        } as StorageWritingError['details'],
        erros: [],
        message: ErrorCodes[code],
      }),
    );
}

/** Erro de escrita do map no storage */
const mapWritingError = readingErr('NFPSMKVS', 'boolean');
/** Erro de escrita de string no storage */
const stringWritingError = readingErr('NFPSSKVS', 'string');
/** Erro de escrita de boolean no storage */
const booleanWritingError = readingErr('NFPSBKVS', 'boolean');
/** Erro de escrita de array no storage */
// const arrayWritingError = readingErr('NFPSAKVS', 'array');
/** Erro de leitura de string no storage */
const stringReadingError = readingErr('NFPLSKVS', 'string');
/** Erro de leitura de map no storage */
const mapReadingError = readingErr('NFPLMKVS', 'object');
/** Erro de leitura de boolean no storage */
const booleanReadingError = readingErr('NFPLBKVS', 'boolean');
/** Erro de leitura de array no storage */
const arrayReadingError = readingErr('NFPLAKVS', 'array');

interface CreateDirectories {
  (
    directories: Array<string>,
  ): Promise<
    | { success: true; error: undefined }
    | { success: false; error: CoreError<SystemError>[] }
  >;
}

const createDirectories: CreateDirectories = async directories =>
  new Promise(async resolve => {
    const errors: CoreError<SystemError>[] = [];
    const numberOfDirectories = directories.length;
    for (let i = 0; i < numberOfDirectories; i++) {
      const dir = directories[i];
      if (!dir) continue;

      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        const err = error as SystemError;
        errors.push(
          CoreError({
            code: 'NFPCDIR0',
            details: err,
            erros: [err?.message],
            message: 'Erro ao criar diretório',
          }),
        );
      }
    }

    if (errors.length === 0) {
      return resolve({ success: true, error: undefined });
    }

    return resolve({ success: false, error: errors });
  });

interface FileStorageProps {
  fileInstance: {
    instanceId: string;
    encrypted: boolean;
  };
}

class FileStorage implements StorageInstance {
  private filesInstance: {
    instanceId: string;
    encrypted: boolean;
  };

  constructor(props: FileStorageProps) {
    this.filesInstance = props.fileInstance;
  }

  setMap(key: string, value: object) {
    return new Promise<Either<StorageWritingError, true>>(async resolve => {
      await createDirectories([this.filesInstance.instanceId]).catch(() => {});
      const filePath = `${this.filesInstance.instanceId}/${key}`;
      const data = JSON.stringify({ value: value });
      fs.writeFile(filePath, data)
        .then(() => resolve(right(true)))
        .catch(e => resolve(mapWritingError(e)));
    });
  }

  setString(key: string, value: string) {
    return new Promise<Either<StorageWritingError, true>>(async resolve => {
      await createDirectories([this.filesInstance.instanceId]).catch(() => {});
      const filePath = `${this.filesInstance.instanceId}/${key}`;
      const data = JSON.stringify({ value: value });
      fs.writeFile(filePath, data)
        .then(() => resolve(right(true)))
        .catch(e => resolve(stringWritingError(e)));
    });
  }

  setBoolean(key: string, value: boolean) {
    return new Promise<Either<StorageWritingError, true>>(async resolve => {
      await createDirectories([this.filesInstance.instanceId]).catch(() => {});
      const filePath = `${this.filesInstance.instanceId}/${key}`;
      const data = JSON.stringify({ value: value });
      fs.writeFile(filePath, data)
        .then(() => resolve(right(true)))
        .catch(e => resolve(booleanWritingError(e)));
    });
  }

  setArray(key: string, value: unknown[]) {
    return new Promise<Either<StorageWritingError, true>>(async resolve => {
      await createDirectories([this.filesInstance.instanceId]).catch(() => {});
      const filePath = `${this.filesInstance.instanceId}/${key}`;
      const data = JSON.stringify({ value: value });
      fs.writeFile(filePath, data)
        .then(() => resolve(right(true)))
        .catch(e => resolve(mapWritingError(e)));
    });
  }

  removeItem(key: string) {
    return new Promise<Either<false, true>>(async resolve => {
      await createDirectories([this.filesInstance.instanceId]).catch(() => {});
      const filePath = `${this.filesInstance.instanceId}/${key}`;
      fs.unlink(filePath)
        .then(() => resolve(right(true)))
        .catch(() => resolve(left(false)));
    });
  }

  getString(key: string) {
    return new Promise<Either<StorageReadingError, string>>(async resolve => {
      // await createDirectories([this.filesInstance.instanceId]).catch(() => {});
      const filePath = `${this.filesInstance.instanceId}/${key}`;
      fs.readFile(filePath, 'utf-8')
        .then(res => {
          const s = JSON.parse(res)?.value as string;
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          typeof s === 'string'
            ? resolve(right(s))
            : resolve(stringReadingError(s));
        })
        .catch(e => resolve(stringReadingError(e)));
    });
  }

  getMap<T>(key: string) {
    return new Promise<Either<StorageReadingError, NonNullable<T>>>(
      async resolve => {
        // await createDirectories([this.filesInstance.instanceId]).catch(() => {});
        const filePath = `${this.filesInstance.instanceId}/${key}`;
        fs.readFile(filePath, 'utf-8')
          .then(res => {
            const s = JSON.parse(res)?.value as T;
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            s ? resolve(right(s)) : resolve(mapReadingError(s));
          })
          .catch(e => resolve(mapReadingError(e)));
      },
    );
  }

  getBoolean(key: string) {
    return new Promise<Either<StorageReadingError, boolean>>(async resolve => {
      // await createDirectories([this.filesInstance.instanceId]).catch(() => {});
      const filePath = `${this.filesInstance.instanceId}/${key}`;
      fs.readFile(filePath, 'utf-8')
        .then(res => {
          const s = JSON.parse(res)?.value as boolean;
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          typeof s === 'boolean'
            ? resolve(right(s))
            : resolve(booleanReadingError(s));
        })
        .catch(e => resolve(booleanReadingError(e)));
    });
  }

  getArray<T>(key: string) {
    return new Promise<Either<StorageReadingError, Array<T>>>(async resolve => {
      // await createDirectories([this.filesInstance.instanceId]).catch(() => {});
      const filePath = `${this.filesInstance.instanceId}/${key}`;
      fs.readFile(filePath, 'utf-8')
        .then(res => {
          const s = JSON.parse(res)?.value as Array<T>;
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          Array.isArray(s) ? resolve(right(s)) : resolve(arrayReadingError(s));
        })
        .catch(e => resolve(arrayReadingError(e)));
    });
  }
}

class FileStorageLoader implements StorageLoader {
  private instanceId: string;
  private encrypted: boolean;
  private dbRoot: string;

  constructor() {
    this.instanceId = 'default';
    this.encrypted = false;
    this.dbRoot = DATABASE_DIR + '/';
  }

  withInstanceID(id: string): this {
    this.instanceId = id;
    return this;
  }

  withEncryption(): this {
    this.encrypted = true;
    return this;
  }

  private initWithEncryption() {
    return {
      instanceId: this.dbRoot + this.instanceId,
      encrypted: this.encrypted,
    };
  }

  private initWithNoEncryption() {
    return {
      instanceId: this.dbRoot + this.instanceId,
      encrypted: this.encrypted,
    };
  }

  initialize(): StorageInstance {
    const storage = this.encrypted
      ? this.initWithEncryption()
      : this.initWithNoEncryption();
    return new FileStorage({ fileInstance: storage });
  }
}

export const fileStorageLoader = () => new FileStorageLoader();
