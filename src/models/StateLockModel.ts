import {
  Joi,
  Model,
  SERVICE_NAME,
  STAGE,
  Table,
  unmarshallDynamoDBImage,
} from '@scaffoldly/serverless-util';
import { StreamRecord } from 'aws-lambda';
import { StateLock } from './interfaces';
import { stateLock } from './schemas/StateLock';

const TABLE_SUFFIX = '';

export class StateLockModel {
  public readonly table: Table<StateLock>;

  public readonly model: Model<StateLock>;

  constructor() {
    this.table = new Table(TABLE_SUFFIX, SERVICE_NAME, STAGE, stateLock, 'pk', 'sk', [
      { hashKey: 'sk', rangeKey: 'pk', name: 'sk-pk-index', type: 'global' },
    ]);

    this.model = this.table.model;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  static prefix = (col: 'pk' | 'sk', value?: any): string => {
    if (col === 'pk') {
      return `github_${value || ''}`;
    }
    return `lock_${value || ''}`;
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
      Joi.assert(pk, stateLock.pk);
      Joi.assert(sk, stateLock.sk);
    } catch (e) {
      return false;
    }

    return true;
  };
}
