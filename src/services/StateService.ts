/**
   Copyright 2022 Scaffoldly LLC

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */
import { StateLockModel } from '../models/StateLockModel';
import { StateModel } from '../models/StateModel';
import crypto from 'crypto';
import { TerraformError } from '../interfaces/errors';
import { IdentityWithToken } from './GithubService';
import { S3 } from '@scaffoldly/serverless-util';
import { env } from '../env';
import { StateLockRequest } from '../models/interfaces/StateLockRequest';
import { StateLockRequestModel } from '../models/StateLockRequestModel';

export class StateService {
  stateModel: StateModel;

  stateLockModel: StateLockModel;

  stateLockRequestModel: StateLockRequestModel;

  constructor() {
    this.stateModel = new StateModel();
    this.stateLockModel = new StateLockModel();
    this.stateLockRequestModel = new StateLockRequestModel();
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public saveState = async (identity: IdentityWithToken, id: string, state: any): Promise<void> => {
    const lockedBy = crypto.createHash('sha256').update(identity.token, 'utf8').digest('base64');

    const stateLockRequest = await this.getRequest(id);

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
        `State is locked by ${identity.meta.name} for ${identity.owner}/${identity.repo} on workspace ${identity.workspace}.`,
      );
      throw new TerraformError(409, stateLockRequest);
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
  ): Promise<void> => {
    const lockedBy = crypto.createHash('sha256').update(identity.token, 'utf8').digest('base64');
    const path = stateLockRequest.Path || '';

    const pk = StateLockModel.prefix('pk', identity.ownerId);
    const sk = StateLockModel.prefix('sk', `${identity.repoId}_${identity.workspace}_${path}`);

    console.log(`Acquiring state lock (pk: ${pk} sk: ${sk})`);

    let stateLock = await this.stateLockModel.model.get(pk, sk);

    if (stateLock && stateLock.attrs.lockedBy !== lockedBy) {
      console.warn(
        `State is locked by ${identity.meta.name} for ${identity.owner}/${identity.repo} on workspace ${identity.workspace}.`,
      );
      throw new TerraformError(409, stateLockRequest);
    }

    if (!stateLockRequest.ID) {
      console.warn(`Missing ID on stateLockRequest`);
      throw new TerraformError(400);
    }

    try {
      stateLock = await this.stateLockModel.model.create(
        {
          pk,
          sk,
          ownerId: identity.ownerId,
          owner: identity.owner,
          repoId: identity.repoId,
          repo: identity.repo,
          workspace: identity.workspace,
          id: stateLockRequest.ID,
          path,
          lockedBy,
        },
        { overwrite: false },
      );
    } catch (e) {
      if ((e as AWS.AWSError).code === 'ConditionalCheckFailedException') {
        throw new TerraformError(409, stateLockRequest);
      }
      throw e;
    }

    await this.stateLockRequestModel.model.update({
      pk: stateLockRequest.pk,
      sk: stateLockRequest.sk,
      stateLock: {
        pk,
        sk,
      },
      identity: {
        pk: identity.pk,
        sk: identity.sk,
      },
    });
  };

  public unlockState = async (
    identity: IdentityWithToken,
    stateLockRequest?: StateLockRequest,
  ): Promise<void> => {
    const path = stateLockRequest ? stateLockRequest.Path || '' : '';
    const pk = StateLockModel.prefix('pk', identity.ownerId);
    const sk = StateLockModel.prefix('sk', `${identity.repoId}_${identity.workspace}_${path}`);

    console.log(`Releasing state lock (pk: ${pk} sk: ${sk})`);

    const stateLock = await this.stateLockModel.model.get(pk, sk);

    if (!stateLock) {
      console.log(
        `No state locks for ${identity.ownerId}/${identity.repoId} on workspace ${identity.workspace} with path ${path}`,
      );
      return;
    }

    await this.stateLockModel.model.destroy(stateLock.attrs.pk, stateLock.attrs.sk);
  };

  public saveRequest = async (stateLockRequest: StateLockRequest): Promise<StateLockRequest> => {
    const saved = await this.stateLockRequestModel.model.create(
      {
        ...stateLockRequest,
        pk: StateLockRequestModel.prefix('pk', stateLockRequest.ID),
        sk: StateLockRequestModel.prefix('sk'),
      },
      { overwrite: false },
    );

    console.log('Saved state lock request', saved.attrs);

    return saved.attrs;
  };

  public getRequest = async (id: string): Promise<StateLockRequest> => {
    const saved = await this.stateLockRequestModel.model.get(
      StateLockRequestModel.prefix('pk', id),
      StateLockRequestModel.prefix('sk'),
    );

    if (!saved) {
      throw new TerraformError(404);
    }

    return saved.attrs;
  };
}
