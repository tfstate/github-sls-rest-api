import Joi from 'joi';

export const stateLockRequest = {
  pk: Joi.string()
    .regex(/lock_(.*)/) // lock_${ID}
    .optional(),
  sk: Joi.string()
    .regex(/statelock/) // statelock
    .optional(),
  ID: Joi.string().optional(),
  Operation: Joi.string().optional(),
  Info: Joi.string().allow('').optional(),
  Who: Joi.string().optional(),
  Version: Joi.string().optional(),
  Created: Joi.string().optional(),
  Path: Joi.string().allow('').optional(),
  stateLock: Joi.object({
    pk: Joi.string().required(),
    sk: Joi.string().required(),
  }).optional(),
  identity: Joi.object({
    pk: Joi.string().required(),
    sk: Joi.string().required(),
  }).optional(),
};

export const stateLockRequestSchema = Joi.object(stateLockRequest).label('StateLockRequest');
