import { ErrorResponse, HttpRequestWithUser } from '@scaffoldly/serverless-util';
import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Path,
  Post,
  Query,
  Request,
  Response,
  Route,
  Security,
  Tags,
} from 'tsoa';
import { ExampleRequest, ExampleResponse, ExampleListResponse } from '../interfaces/example';
import { ExampleService } from '../services/ExampleService';

@Route('/api/v1/examples')
@Tags('Example')
export class ExampleControllerV1 extends Controller {
  exampleService: ExampleService;

  constructor() {
    super();
    this.exampleService = new ExampleService();
  }

  @Post()
  @Response<ErrorResponse>('4XX')
  @Response<ErrorResponse>('5XX')
  @Security('jwt')
  public create(
    @Body() request: ExampleRequest,
    @Request() httpRequest: HttpRequestWithUser,
  ): Promise<ExampleResponse> {
    return this.exampleService.create(request, httpRequest.user);
  }

  @Get()
  @Response<ErrorResponse>('4XX')
  @Response<ErrorResponse>('5XX')
  @Security('jwt')
  public list(
    @Request() httpRequest: HttpRequestWithUser,
    @Query('nextPk') nextPk?: string,
    @Query('nextSk') nextSk?: string,
    @Query('limit') limit?: number,
  ): Promise<ExampleListResponse> {
    return this.exampleService.list(httpRequest.user, nextPk, nextSk, limit);
  }

  @Get('{exampleId}')
  @Response<ErrorResponse>('4XX')
  @Response<ErrorResponse>('5XX')
  @Security('jwt')
  public getById(
    @Path('exampleId') exampleId: string,
    @Request() httpRequest: HttpRequestWithUser,
  ): Promise<ExampleResponse> {
    return this.exampleService.getById(exampleId, httpRequest.user);
  }

  @Patch('{exampleId}')
  @Response<ErrorResponse>('4XX')
  @Response<ErrorResponse>('5XX')
  @Security('jwt')
  public updateById(
    @Path('exampleId') exampleId: string,
    @Body() exampleRequest: ExampleRequest,
    @Request() httpRequest: HttpRequestWithUser,
  ): Promise<ExampleResponse> {
    return this.exampleService.updateById(exampleId, exampleRequest, httpRequest.user);
  }

  @Delete('{exampleId}')
  @Response<null>('204')
  @Response<ErrorResponse>('4XX')
  @Response<ErrorResponse>('5XX')
  @Security('jwt')
  public deleteById(
    @Path('exampleId') exampleId: string,
    @Query('async') async = false,
    @Request() httpRequest: HttpRequestWithUser,
  ): Promise<ExampleResponse | null> {
    return this.exampleService.deleteById(exampleId, httpRequest.user, async);
  }
}
