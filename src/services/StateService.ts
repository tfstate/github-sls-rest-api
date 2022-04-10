import { StateLockModel } from '../models/StateLockModel';
import { StateModel } from '../models/StateModel';
import { KmsService } from './aws/kms/KmsService';
import { EncryptionService } from './interfaces/EncryptionService';
import crypto from 'crypto';
import moment from 'moment';
import { StateLockRequest } from '../models/interfaces';
import { TerraformError } from '../interfaces/errors';
import { IdentityWithToken } from './GithubService';
import { S3 } from '@scaffoldly/serverless-util';
import { env } from '../env';

export class StateService {
  encryptionService: EncryptionService;

  stateModel: StateModel;

  stateLockModel: StateLockModel;

  constructor() {
    this.stateModel = new StateModel();
    this.stateLockModel = new StateLockModel();
    this.encryptionService = new KmsService();
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public saveState = async (identity: IdentityWithToken, id: string, state: any): Promise<void> => {
    const lockedBy = crypto.createHash('sha256').update(identity.token, 'utf8').digest('base64');

    const [stateLocks] = await this.stateLockModel.model
      .query(StateLockModel.prefix('pk', identity.ownerId))
      .where('sk')
      .beginsWith(StateLockModel.prefix('sk', `${identity.repoId}_${identity.workspace}`))
      .filter('id')
      .eq(id)
      .exec()
      .promise();

    if (!stateLocks || !stateLocks.Count) {
      throw new TerraformError(400);
    }

    const [stateLock] = stateLocks.Items;

    if (stateLock.attrs.lockedBy !== lockedBy) {
      console.warn(
        `State is locked by ${identity.meta.name} for ${identity.owner}/${
          identity.repo
        } on workspace ${identity.workspace}. Lock expires at approximately ${moment(
          stateLock.attrs.expires * 1000,
        ).toISOString()}`,
      );
      throw new TerraformError(409, stateLock.attrs.request);
    }

    const s3 = await S3();
    const upload = await s3
      .upload({
        Bucket: env.bucket,
        Key: `${identity.ownerId}/${identity.repoId}/${identity.workspace}.tfstate`,
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: env['key-id'],
        Body: JSON.stringify(state),
      })
      .promise();

    await this.stateModel.model.create({
      pk: StateModel.prefix('pk', identity.ownerId),
      sk: StateModel.prefix('sk', `${identity.repoId}_${identity.workspace}`),
      ownerId: identity.ownerId,
      owner: identity.owner,
      repoId: identity.repoId,
      repo: identity.repo,
      workspace: identity.workspace,
      s3Meta: {
        bucket: upload.Bucket,
        key: upload.Key,
        etag: upload.ETag,
        location: upload.Location,
        kmsKeyId: env['key-id'],
      },
    });
  };

  public getState = async (identity: IdentityWithToken): Promise<any> => {
    const state = await this.stateModel.model.get(
      StateModel.prefix('pk', identity.ownerId),
      StateModel.prefix('sk', `${identity.repoId}_${identity.workspace}`),
    );

    if (!state) {
      console.warn(
        `State not found (pk: ${StateModel.prefix('pk', identity.ownerId)} sk: ${StateModel.prefix(
          'sk',
          `${identity.repoId}_${identity.workspace}`,
        )})`,
      );
      return null;
    }

    const { s3Meta } = state.attrs;

    console.log(`Fetching state from S3`, s3Meta);

    const s3 = await S3();
    const download = await s3.getObject({ Bucket: s3Meta.bucket, Key: s3Meta.key }).promise();

    const { Body } = download;

    if (!Body) {
      console.warn(`State not found in S3`);
      return null;
    }

    return JSON.parse(Body.toString());
  };

  public lockState = async (
    identity: IdentityWithToken,
    stateLockRequest: StateLockRequest,
    duration = 30,
  ): Promise<void> => {
    const lockedBy = crypto.createHash('sha256').update(identity.token, 'utf8').digest('base64');

    const stateLock = await this.stateLockModel.model.get(
      StateLockModel.prefix('pk', identity.ownerId),
      StateLockModel.prefix(
        'sk',
        `${identity.repoId}_${identity.workspace}_${stateLockRequest.Path}`,
      ),
    );

    if (stateLock && stateLock.attrs.lockedBy !== lockedBy) {
      console.warn(
        `State is locked by ${identity.meta.name} for ${identity.owner}/${
          identity.repo
        } on workspace ${identity.workspace}. Lock expires at approximately ${moment(
          stateLock.attrs.expires * 1000,
        ).toISOString()}`,
      );
      throw new TerraformError(409, stateLock.attrs.request);
    }

    // TODO Catch overwrite exception
    await this.stateLockModel.model.create({
      pk: StateLockModel.prefix('pk', identity.ownerId),
      sk: StateLockModel.prefix(
        'sk',
        `${identity.repoId}_${identity.workspace}_${stateLockRequest.Path}`,
      ),
      ownerId: identity.ownerId,
      owner: identity.owner,
      repoId: identity.repoId,
      repo: identity.repo,
      workspace: identity.workspace,
      id: stateLockRequest.ID,
      path: stateLockRequest.Path,
      lockedBy,
      request: stateLockRequest,
      expires: moment().add(duration, 'minute').unix(),
    });
  };

  public unlockState = async (
    identity: IdentityWithToken,
    stateLockRequest: StateLockRequest,
  ): Promise<void> => {
    const lockedBy = crypto.createHash('sha256').update(identity.token, 'utf8').digest('base64');

    const [stateLocks] = await this.stateLockModel.model
      .query(StateLockModel.prefix('pk', identity.ownerId))
      .where('sk')
      .beginsWith(StateLockModel.prefix('sk', `${identity.repoId}_${identity.workspace}`))
      .filter('id')
      .eq(stateLockRequest.ID)
      .exec()
      .promise();

    if (!stateLocks || !stateLocks.Count) {
      console.log(
        `No state locks for ${identity.ownerId}/${identity.repoId} on workspace ${identity.workspace} with id ${stateLockRequest.ID}`,
      );
      return;
    }

    const [stateLock] = stateLocks.Items;

    if (stateLock.attrs.lockedBy !== lockedBy) {
      console.warn(
        `State is locked by ${identity.meta.name} for ${identity.owner}/${
          identity.repo
        } on workspace ${identity.workspace}. Lock expires at approximately ${moment(
          stateLock.attrs.expires * 1000,
        ).toISOString()}`,
      );
      throw new TerraformError(409, stateLock.attrs.request);
    }

    await this.stateLockModel.model.destroy(stateLock.attrs.pk, stateLock.attrs.sk);
  };
}
