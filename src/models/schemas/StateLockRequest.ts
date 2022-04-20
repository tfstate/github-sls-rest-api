import Joi from 'joi';

export const stateLockRequest = {
  pk: Joi.string()
    .regex(/lock_(.*)/) // lock_${ID}
    .optional(),
  sk: Joi.string()
    .regex(/statelock/) // statelock
    .optional(),
  ID: Joi.string().required(),
  Operation: Joi.string().required(),
  Info: Joi.string().allow('').optional(),
  Who: Joi.string().required(),
  Version: Joi.string().required(),
  Created: Joi.string().required(),
  Path: Joi.string().allow('').required(),
  stateLock: Joi.object({
    pk: Joi.string().required(),
    sk: Joi.string().required(),
  }).optional(),
  identity: Joi.object({
    pk: Joi.string().required(),
    sk: Joi.string().required(),
  }),
};

export const stateLockRequestSchema = Joi.object(stateLockRequest).label('StateLockRequest');
