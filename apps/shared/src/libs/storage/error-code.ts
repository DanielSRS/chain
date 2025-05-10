export const ErrorCodes = {
  MCWIDOMC: 'Member creation with invalid data on model constructor',
  UCF00000: 'User creation failed',
  EKCF0000: 'Encription keys creation failed',
  NFPSUSA0: 'Não foi possível salvar o usuário no sistema de arquivos',
  OCWIDOMC: 'Organization creation with invalid data on model constructor',
  KPCIDOMC: 'KeyPair creation with invalid data on model constructor',
  UCWIDOMC: 'Organization creation with invalid data on model constructor',
  FTPOFD00: 'Fail to parse organization file data',
  NFPLADO0: 'Não foi possivel ler arquivo de organização',
  NFPSORSA: 'Não foi possível salvar organização no sistema de arquivos',
  NFPCDIR0: 'Não foi possível diretorio',
  NFPSMKVS: 'Não foi possivel salvar map no mmkv storage',
  NFPSSKVS: 'Não foi possivel salvar string no mmkv storage',
  NFPSBKVS: 'Não foi possivel salvar boolean no mmkv storage',
  NFPSAKVS: 'Não foi possivel salvar array no mmkv storage',
  NFPLSKVS: 'Não foi possivel ler string no mmkv storage',
  NFPLMKVS: 'Não foi possivel ler map no mmkv storage',
  NFPLBKVS: 'Não foi possivel ler boolean no mmkv storage',
  NFPLAKVS: 'Não foi possivel ler array no mmkv storage',
  CUFWNIER: 'Create user failed with new instance error',
  CUFWSTER: 'Create user failed with storage error',
} as const;

/** https://stackoverflow.com/questions/59251860/use-keys-of-an-object-as-union-type */
export type ErrorCode = keyof typeof ErrorCodes;
