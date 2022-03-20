import {
  Joi,
  Model,
  SERVICE_NAME,
  STAGE,
  Table,
  unmarshallDynamoDBImage,
} from '@scaffoldly/serverless-util';
import { StreamRecord } from 'aws-lambda';
import { Example } from './interfaces';
import { example } from './schemas/Example';

const TABLE_SUFFIX = '';

export class ExampleModel {
  public readonly table: Table<Example>;

  public readonly model: Model<Example>;

  constructor() {
    this.table = new Table(TABLE_SUFFIX, SERVICE_NAME, STAGE, example, 'pk', 'sk', [
      { hashKey: 'sk', rangeKey: 'pk', name: 'sk-pk-index', type: 'global' },
    ]);

    this.model = this.table.model;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  static prefix = (col: 'pk' | 'sk', value?: any): string => {
    if (col === 'pk') {
      return `userid_${value || ''}`;
    }
    return `example_${value || ''}`;
  };

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  static isExample = (record: StreamRecord): boolean => {
    if (!record) {
      return false;
    }

    const check = unmarshallDynamoDBImage(record.Keys) as { pk: string; sk: string };

    if (!check.pk || !check.sk || typeof check.pk !== 'string' || typeof check.sk !== 'string') {
      return false;
    }

    const { pk, sk } = check;

    try {
      Joi.assert(pk, example.pk);
      Joi.assert(sk, example.sk);
    } catch (e) {
      return false;
    }

    return true;
  };
}
