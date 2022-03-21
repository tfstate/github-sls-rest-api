import { EncryptedField } from '../../models/interfaces';

export interface EncryptionService {
  encrypt(value: string, keyId?: string): Promise<EncryptedField>;
  decrypt(encryptedField: EncryptedField): Promise<string>;
}
