import Joi from 'joi';
import { encryptedFieldSchema } from './EncryptedField';

export const state = {
  pk: Joi.string().required(), // github_${ownerId}
  sk: Joi.string()
    .regex(/state_(.*)/) // state_${repoId}
    .required(),
  ownerId: Joi.number().required(),
  repoId: Joi.number().required(),
  owner: Joi.string().required(),
  repo: Joi.string().required(),
  encryptedState: encryptedFieldSchema.required(),
};

export const stateSchema = Joi.object(state).label('State');