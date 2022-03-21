import Joi from 'joi';

export const encryptedFieldSchema = Joi.object({
  keyId: Joi.string().required(),
  encryptedValue: Joi.string().required(),
}).label('EncryptedField');
