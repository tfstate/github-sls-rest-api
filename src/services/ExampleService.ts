import { BaseJwtPayload, HttpError, extractUserId } from '@scaffoldly/serverless-util';
import moment from 'moment';
import { ulid } from 'ulid';
import { ExampleRequest, ExampleResponse, ExampleListResponse } from '../interfaces/example';
import { ExampleModel } from '../models/ExampleModel';
import { Example } from '../models/interfaces';

export class ExampleService {
  exampleModel: ExampleModel;

  constructor() {
    this.exampleModel = new ExampleModel();
  }

  public create = async (
    exampleRequest: ExampleRequest,
    user: BaseJwtPayload,
  ): Promise<Example> => {
    const exampleId = ulid();
    console.log(`Creating with id:`, JSON.stringify(exampleRequest));

    const example = await this.exampleModel.model.create(
      {
        pk: ExampleModel.prefix('pk', extractUserId(user, '__ANONYMOUS__')),
        sk: ExampleModel.prefix('sk', exampleId),
        exampleId,
        userId: extractUserId(user, '__ANONYMOUS__'),
        ...exampleRequest,
      },
      { overwrite: false },
    );

    console.log(`Created with id`, JSON.stringify(example.attrs));

    if (!example || !example.attrs) {
      throw new HttpError(500, 'Unable to create');
    }

    return example.attrs;
  };

  public list = async (
    user: BaseJwtPayload,
    nextPk?: string,
    nextSk?: string,
    limit?: number,
  ): Promise<ExampleListResponse> => {
    if ((nextPk && !nextSk) || (!nextPk && nextSk)) {
      throw new HttpError(400, 'nextPk and nextSk are required together');
    }

    console.log(
      `Listing for user: ${extractUserId(
        user,
        '__ANONYMOUS__',
      )}, nextPk: ${nextPk}, nextSk: ${nextSk}, limit: ${limit}`,
    );

    const [count] = await this.exampleModel.model
      .query(ExampleModel.prefix('pk', extractUserId(user, '__ANONYMOUS__')))
      .where('sk')
      .beginsWith(ExampleModel.prefix('sk'))
      .filter('expires')
      .exists(false)
      .select('COUNT')
      .exec()
      .promise();

    let query = this.exampleModel.model
      .query(ExampleModel.prefix('pk', extractUserId(user, '__ANONYMOUS__')))
      .where('sk')
      .beginsWith(ExampleModel.prefix('sk'))
      .filter('expires')
      .exists(false);

    if (nextPk && nextSk) {
      query = query.startKey(nextPk, nextSk);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const [results] = await query.exec().promise();

    if (!results || !results.Count) {
      console.log('No results');
      return { results: [], count: 0, total: 0 };
    }

    console.log(
      `Found ${results.Count}/${count.Count} results. Last evaluated key: ${results.LastEvaluatedKey}`,
    );

    return {
      results: results.Items.map((item) => item.attrs),
      count: results.Items.length,
      total: count.Count,
      next: results.LastEvaluatedKey
        ? { pk: results.LastEvaluatedKey.pk, sk: results.LastEvaluatedKey.sk }
        : undefined,
    };
  };

  public getById = async (exampleId: string, user: BaseJwtPayload): Promise<ExampleResponse> => {
    const example = await this.exampleModel.model.get(
      ExampleModel.prefix('pk', extractUserId(user, '__ANONYMOUS__')),
      ExampleModel.prefix('sk', exampleId),
    );

    if (!example || example.attrs.expires) {
      throw new HttpError(404, 'Not Found');
    }

    return example.attrs;
  };

  public updateById = async (
    exampleId: string,
    exampleRequest: ExampleRequest,
    user: BaseJwtPayload,
  ): Promise<ExampleResponse> => {
    let example = await this.exampleModel.model.get(
      ExampleModel.prefix('pk', extractUserId(user, '__ANONYMOUS__')),
      ExampleModel.prefix('sk', exampleId),
    );

    if (!example || example.attrs.expires) {
      throw new HttpError(404, 'Not Found');
    }

    example = await this.exampleModel.model.update({
      pk: ExampleModel.prefix('pk', extractUserId(user, '__ANONYMOUS__')),
      sk: ExampleModel.prefix('sk', exampleId),
      ...exampleRequest,
    });

    if (!example || !example.attrs) {
      throw new HttpError(500, 'Unable to update example');
    }

    return example.attrs;
  };

  public deleteById = async (
    exampleId: string,
    user: BaseJwtPayload,
    async = false,
  ): Promise<ExampleResponse | null> => {
    if (async) {
      let example = await this.exampleModel.model.get(
        ExampleModel.prefix('pk', extractUserId(user, '__ANONYMOUS__')),
        ExampleModel.prefix('sk', exampleId),
      );

      if (!example || example.attrs.expires) {
        throw new HttpError(404, 'Not Found');
      }

      // Set expires on row for DynamoDB expiration
      example = await this.exampleModel.model.update({
        pk: ExampleModel.prefix('pk', extractUserId(user, '__ANONYMOUS__')),
        sk: ExampleModel.prefix('sk', exampleId),
        expires: moment().unix(),
      });

      return example.attrs;
    }

    await this.exampleModel.model.destroy(
      ExampleModel.prefix('pk', extractUserId(user, '__ANONYMOUS__')),
      ExampleModel.prefix('sk', exampleId),
    );
    return null;
  };

  public handleAdd = async (example: Example): Promise<Example | null> => {
    console.log('Added', JSON.stringify(example));
    // Here you can do any async handling of new entities
    // Optionally, return null if you want the event to continue propagation to additional handlers in the controller
    return example;
  };

  public handleModify = async (
    newExample: Example,
    prevExample: Example,
  ): Promise<Example | null> => {
    console.log('Modified:', JSON.stringify(newExample));
    console.log('Previous:', JSON.stringify(prevExample));
    // Here you can do any async handling of updated entities
    // Optionally, return null if you want the event to continue propagation to additional handlers in the controller
    return newExample;
  };

  public handleRemove = async (example: Example): Promise<Example | null> => {
    console.log('Removed', JSON.stringify(example));
    // Here you can do any async handling of removed entities
    // Optionally, return null if you want the event to continue propagation to additional handlers in the controller
    return example;
  };
}
