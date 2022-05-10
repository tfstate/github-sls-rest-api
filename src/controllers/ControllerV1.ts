import { HttpRequest } from '@scaffoldly/serverless-util';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatusCodeLiteral,
  Post,
  Put,
  Query,
  Request,
  Res,
  Route,
  Tags,
  TsoaResponse,
} from 'tsoa';
import { TerraformError } from '../interfaces/errors';
import { StateLockRequest } from '../models/interfaces/StateLockRequest';
import { GithubService } from '../services/GithubService';
import { StateService } from '../services/StateService';

type HeaderType = { [key: string]: string | string[] };

@Route('/v1')
@Tags('v1')
export class ControllerV1 extends Controller {
  githubService: GithubService;

  stateService: StateService;

  constructor() {
    super();
    this.githubService = new GithubService();
    this.stateService = new StateService();
  }

  @Get()
  public async getState(
    @Request() request: HttpRequest,
    @Res() res: TsoaResponse<200 | 400 | 401 | 404, any>,
  ): Promise<TsoaResponse<HttpStatusCodeLiteral, any, HeaderType>> {
    try {
      const identity = await this.githubService.getIdentity(request);
      const state = await this.stateService.getState(identity);
      const response = res(200, state);
      return response;
    } catch (e) {
      if (e instanceof TerraformError) {
        return e.respond(res);
      }
      throw e;
    }
  }

  @Post()
  public async saveState(
    @Request() request: HttpRequest,
    @Query('ID') id: string,
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    @Body() state: any,
    @Res() res: TsoaResponse<200 | 400 | 401 | 404 | 409, void>,
  ): Promise<TsoaResponse<HttpStatusCodeLiteral, void, HeaderType>> {
    try {
      const stateLockRequest = await this.stateService.getRequest(id);
      const identity = await this.githubService.getIdentity(request, stateLockRequest);
      await this.stateService.saveState(identity, id, state);
      const response = res(200);
      return response;
    } catch (e) {
      if (e instanceof TerraformError) {
        return e.respond(res);
      }
      throw e;
    }
  }

  @Put('lock')
  public async lockState(
    @Request() request: HttpRequest,
    @Body() lockRequest: StateLockRequest,
    @Res() res: TsoaResponse<200 | 400 | 401 | 404 | 409, boolean>,
  ): Promise<TsoaResponse<HttpStatusCodeLiteral, boolean, HeaderType>> {
    try {
      const stateLockRequest = await this.stateService.saveRequest(lockRequest);
      const identity = await this.githubService.getIdentity(request, stateLockRequest);
      await this.stateService.lockState(identity, stateLockRequest);
      const response = res(200, true);
      return response;
    } catch (e) {
      if (e instanceof TerraformError) {
        return e.respond(res);
      }
      throw e;
    }
  }

  @Delete('lock')
  public async unlockState(
    @Request() request: HttpRequest,
    @Body() lockRequest: StateLockRequest,
    @Res() res: TsoaResponse<200 | 400 | 401 | 404 | 409, boolean>,
  ): Promise<TsoaResponse<HttpStatusCodeLiteral, boolean, HeaderType>> {
    try {
      const stateLockRequest = await this.stateService.getRequest(lockRequest.ID);
      const identity = await this.githubService.getIdentity(request, stateLockRequest);
      await this.stateService.unlockState(identity, stateLockRequest);
      const response = res(200, true);
      return response;
    } catch (e) {
      if (e instanceof TerraformError) {
        return e.respond(res);
      }
      throw e;
    }
  }
}
