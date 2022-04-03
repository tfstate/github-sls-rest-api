import Joi from 'joi';

export const stateLockRequest = Joi.object({
  ID: Joi.string().required(),
  Operation: Joi.string().required(),
  Info: Joi.string().allow('').optional(),
  Who: Joi.string().required(),
  Version: Joi.string().required(),
  Created: Joi.string().required(),
  Path: Joi.string().allow('').required(),
}).label('StateLockRequest');

export const stateLock = {
  pk: Joi.string().required(), // github_${orgId}
  sk: Joi.string()
    .regex(/lock_(.*)_(.*)/) // lock_${repoId}_${workspace}_${path}
    .required(),
  ownerId: Joi.number().required(),
  repoId: Joi.number().required(),
  workspace: Joi.string().required(),
  owner: Joi.string().required(),
  repo: Joi.string().required(),
  id: Joi.string().required(),
  path: Joi.string().allow('').required(),
  lockedBy: Joi.string().required(),
  request: stateLockRequest.required(),
  expires: Joi.number().required(),
};

export const stateLockSchema = Joi.object(stateLock).label('StateLock');
