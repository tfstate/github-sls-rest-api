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
