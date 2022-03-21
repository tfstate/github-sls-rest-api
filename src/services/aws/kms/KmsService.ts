import { decryptValue, encryptValue } from '@scaffoldly/serverless-util';
import { EncryptedField } from '../../../models/interfaces';
import { EncryptionService } from '../../interfaces/EncryptionService';

export class KmsService implements EncryptionService {
  async encrypt(value: string, keyId?: string): Promise<EncryptedField> {
    const encryptedValue = await encryptValue(value, keyId);
    return {
      keyId: encryptedValue.keyId,
      encryptedValue: encryptedValue.value,
    };
  }

  async decrypt(encryptedField: EncryptedField): Promise<string> {
    const decryptedValue = await decryptValue({
      keyId: encryptedField.keyId,
      value: encryptedField.encryptedValue,
    });
    return decryptedValue;
  }
}
