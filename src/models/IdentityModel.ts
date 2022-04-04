import {
  Joi,
  Model,
  SERVICE_NAME,
  STAGE,
  Table,
  unmarshallDynamoDBImage,
} from '@scaffoldly/serverless-util';
import { StreamRecord } from 'aws-lambda';
import { Identity } from './interfaces';
import { identity } from './schemas/Identity';
const TABLE_SUFFIX = 'identity';

export class IdentityModel {
  public readonly table: Table<Identity>;

  public readonly model: Model<Identity>;

  constructor() {
    this.table = new Table(TABLE_SUFFIX, SERVICE_NAME, STAGE, identity, 'pk', 'sk', [
      { hashKey: 'sk', rangeKey: 'pk', name: 'sk-pk-index', type: 'global' },
    ]);

    this.model = this.table.model;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  static prefix = (col: 'pk' | 'sk', value?: any): string => {
    if (col === 'pk') {
      return `github_${value || ''}`;
    }
    return `identity`;
  };

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  static isIdentity = (record: StreamRecord): boolean => {
    if (!record) {
      return false;
    }

    const check = unmarshallDynamoDBImage(record.Keys) as { pk: string; sk: string };

    if (!check.pk || !check.sk || typeof check.pk !== 'string' || typeof check.sk !== 'string') {
      return false;
    }

    const { pk, sk } = check;

    try {
      Joi.assert(pk, identity.pk);
      Joi.assert(sk, identity.sk);
    } catch (e) {
      return false;
    }

    return true;
  };
}
