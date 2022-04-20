import Joi from 'joi';

export const stateLock = {
  pk: Joi.string()
    .regex(/github_(.*)/) // github_${orgId}
    .required(),
  sk: Joi.string()
    .regex(/statelock_(.*)_(.*)_(.*)/) // statelock_${repoId}_${workspace}_${path}
    .required(),
  ownerId: Joi.number().required(),
  repoId: Joi.number().required(),
  workspace: Joi.string().required(),
  owner: Joi.string().required(),
  repo: Joi.string().required(),
  id: Joi.string().required(),
  path: Joi.string().allow('').required(),
  lockedBy: Joi.string().required(),
};

export const stateLockSchema = Joi.object(stateLock).label('StateLock');
