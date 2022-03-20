import Joi from 'joi';

export const example = {
  pk: Joi.string()
    .required()
    .regex(/userid_(.*)/),
  sk: Joi.string()
    .required()
    .regex(/example_(.*)/),
  userId: Joi.string().required(),
  exampleId: Joi.string().required(),
  expires: Joi.number().optional(),
  // ... other fields go here, for example, 'value' for demonstration purposes
  value: Joi.string().optional(),
};

export const exampleSchema = Joi.object(example).label('Example');
