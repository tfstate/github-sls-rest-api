import Joi from 'joi';

export const s3Meta = Joi.object({
  bucket: Joi.string().required(),
  key: Joi.string().required(),
  etag: Joi.string().required(),
  location: Joi.string().required(),
  kmsKeyId: Joi.string().required(),
}).label('S3Meta');

export const state = {
  pk: Joi.string()
    .regex(/github_(.*)/) // github_${ownerId}
    .required(),
  sk: Joi.string()
    .regex(/state_(.*)/) // state_${repoId}_${workspace}
    .required(),
  ownerId: Joi.number().required(),
  repoId: Joi.number().required(),
  workspace: Joi.string().required(),
  owner: Joi.string().required(),
  repo: Joi.string().required(),
  s3Meta: s3Meta.required(),
};

export const stateSchema = Joi.object(state).label('State');
