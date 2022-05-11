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
