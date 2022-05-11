/**
   Copyright 2022 Scaffoldly LLC

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */
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
