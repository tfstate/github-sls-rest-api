import Joi from 'joi';

export const metaSchema = Joi.object({
  name: Joi.string().required(),
}).label('IdentityMeta');

export const identity = {
  pk: Joi.string()
    .regex(/github_(.*)/) // github_${tokenSha}
    .required(),
  sk: Joi.string()
    .regex(/identity/) // identity
    .required(),
  tokenSha: Joi.string().required(),
  owner: Joi.string().required(),
  ownerId: Joi.number().required(),
  repo: Joi.string().required(),
  repoId: Joi.number().required(),
  workspace: Joi.string().required(),
  meta: metaSchema.required(),
};

export const identitySchema = Joi.object(identity).label('Identity');
