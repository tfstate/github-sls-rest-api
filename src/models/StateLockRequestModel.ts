import {
  Joi,
  Model,
  SERVICE_NAME,
  STAGE,
  Table,
  unmarshallDynamoDBImage,
} from '@scaffoldly/serverless-util';
import { StreamRecord } from 'aws-lambda';
import { StateLockRequest } from './interfaces/StateLockRequest';
import { stateLockRequest } from './schemas/StateLockRequest';

const TABLE_SUFFIX = '';

export class StateLockRequestModel {
  public readonly table: Table<StateLockRequest>;

  public readonly model: Model<StateLockRequest>;

  constructor() {
    this.table = new Table(TABLE_SUFFIX, SERVICE_NAME, STAGE, stateLockRequest, 'pk', 'sk', [
      { hashKey: 'sk', rangeKey: 'pk', name: 'sk-pk-index', type: 'global' },
    ]);

    this.model = this.table.model;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  static prefix = (col: 'pk' | 'sk', value?: any): string => {
    if (col === 'pk') {
      return `lock_${value || ''}`;
    }
    return `statelock`;
  };

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  static isStateLock = (record: StreamRecord): boolean => {
    if (!record) {
      return false;
    }

    const check = unmarshallDynamoDBImage(record.Keys) as { pk: string; sk: string };

    if (!check.pk || !check.sk || typeof check.pk !== 'string' || typeof check.sk !== 'string') {
      return false;
    }

    const { pk, sk } = check;

    try {
      Joi.assert(pk, stateLockRequest.pk);
      Joi.assert(sk, stateLockRequest.sk);
    } catch (e) {
      return false;
    }

    return true;
  };
}
