import { encrypt, decrypt } from '../src/utils/crypto';

const key = 'c'.repeat(64);

jest.mock('../src/utils/configManager', () => ({
  __esModule: true,
  default: {
    getEncryptionKey: () => key
  }
}));

describe('crypto utils', () => {
  it('encrypts and decrypts payload', () => {
    const message = 'Sentinel encryption test';
    const payload = encrypt(message);
    const result = decrypt(payload);
    expect(result).toBe(message);
  });
});
