import { handleDynamoDBStreamRecord, HttpError } from '@scaffoldly/serverless-util';
import { DynamoDBStreamEvent } from 'aws-lambda';
import { Body, Controller, Header, Hidden, Post, Route, Tags } from 'tsoa';
import { ExampleModel } from '../models/ExampleModel';
import { Example } from '../models/interfaces';
import { ExampleService } from '../services/ExampleService';

@Route('/events/dynamodb')
@Tags('DynamoDB Events')
@Hidden()
export class DynamoDBEventController extends Controller {
  exampleService: ExampleService;

  constructor() {
    super();

    this.exampleService = new ExampleService();
  }

  @Post()
  public async event(
    @Header('Host') host: string,
    @Body() event: unknown,
  ): Promise<Example | null> {
    if (host !== 'dynamodb.amazonaws.com') {
      throw new HttpError(403, 'Forbidden');
    }

    // batchSize in serverless.yml is 1, blindly get the first record
    const [record] = (event as DynamoDBStreamEvent).Records;

    let handled;

    // eslint-disable-next-line prefer-const
    handled = await handleDynamoDBStreamRecord(record, {
      canHandle: ExampleModel.isExample,
      onInsert: this.exampleService.handleAdd,
      onModify: this.exampleService.handleModify,
      onRemove: this.exampleService.handleRemove,
    });
    if (handled) {
      return handled;
    }

    console.warn('Unhandled stream record', record.dynamodb && record.dynamodb.Keys);

    return null;
  }
}
