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
import {
  Joi,
  Model,
  SERVICE_NAME,
  STAGE,
  Table,
  unmarshallDynamoDBImage,
} from '@scaffoldly/serverless-util';
import { StreamRecord } from 'aws-lambda';
import { State } from './interfaces';
import { state } from './schemas/State';

const TABLE_SUFFIX = '';

export class StateModel {
  public readonly table: Table<State>;

  public readonly model: Model<State>;

  constructor() {
    this.table = new Table(TABLE_SUFFIX, SERVICE_NAME, STAGE, state, 'pk', 'sk', [
      { hashKey: 'sk', rangeKey: 'pk', name: 'sk-pk-index', type: 'global' },
    ]);

    this.model = this.table.model;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  static prefix = (col: 'pk' | 'sk', value?: any): string => {
    if (col === 'pk') {
      return `github_${value || ''}`;
    }
    return `state_${value || ''}`;
  };

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  static isState = (record: StreamRecord): boolean => {
    if (!record) {
      return false;
    }

    const check = unmarshallDynamoDBImage(record.Keys) as { pk: string; sk: string };

    if (!check.pk || !check.sk || typeof check.pk !== 'string' || typeof check.sk !== 'string') {
      return false;
    }

    const { pk, sk } = check;

    try {
      Joi.assert(pk, state.pk);
      Joi.assert(sk, state.sk);
    } catch (e) {
      return false;
    }

    return true;
  };
}
