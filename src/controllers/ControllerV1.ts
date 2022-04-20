import { HttpRequest } from '@scaffoldly/serverless-util';
import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  Request,
  Res,
  Route,
  Tags,
  TsoaResponse,
} from 'tsoa';
import { StateLockRequest } from '../models/interfaces/StateLockRequest';
import { GithubService } from '../services/GithubService';
import { StateService } from '../services/StateService';

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
  public async getState(@Request() request: HttpRequest): Promise<any> {
    const identity = await this.githubService.getIdentity(request);
    return this.stateService.getState(identity);
  }

  @Post()
  public async saveState(
    @Request() request: HttpRequest,
    @Query('ID') id: string,
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    @Body() state: any,
    @Res() res: TsoaResponse<200, void>,
  ): Promise<void> {
    const stateLockRequest = await this.stateService.getRequest(id);
    const identity = await this.githubService.getIdentity(request, stateLockRequest);
    await this.stateService.saveState(identity, id, state);
    const response = res(200);
    return response;
  }

  @Put('lock')
  public async lockState(
    @Request() request: HttpRequest,
    @Body() lockRequest: StateLockRequest,
    @Res() res: TsoaResponse<200, boolean>,
  ): Promise<boolean> {
    const stateLockRequest = await this.stateService.saveRequest(lockRequest);
    const identity = await this.githubService.getIdentity(request, stateLockRequest);
    await this.stateService.lockState(identity, stateLockRequest);
    const response = res(200, true);
    return response;
  }

  @Delete('lock')
  public async unlockState(
    @Request() request: HttpRequest,
    @Body() lockRequest: StateLockRequest,
    @Res() res: TsoaResponse<200, boolean>,
  ): Promise<boolean> {
    const stateLockRequest = await this.stateService.getRequest(lockRequest.ID);
    const identity = await this.githubService.getIdentity(request, stateLockRequest);
    await this.stateService.unlockState(identity, stateLockRequest);
    const response = res(200, true);
    return response;
  }
}
