import { StateLockModel } from '../models/StateLockModel';
import { StateModel } from '../models/StateModel';
import { KmsService } from './aws/kms/KmsService';
import { Identity } from './GithubService';
import { EncryptionService } from './interfaces/EncryptionService';
import crypto from 'crypto';
import moment from 'moment';
import { StateLockRequest } from '../models/interfaces';
import { TerraformError } from '../interfaces/errors';

// TODO Save old states
// TODO Unlock state testing
// TODO: Research when state should be auto-unlocked after a plan operation

export class StateService {
  encryptionService: EncryptionService;

  stateModel: StateModel;

  stateLockModel: StateLockModel;

  constructor() {
    this.stateModel = new StateModel();
    this.stateLockModel = new StateLockModel();
    this.encryptionService = new KmsService();
  }

  public getState = async (identity: Identity): Promise<any> => {
    const state = await this.stateModel.model.get(
      StateModel.prefix('pk', identity.ownerId),
      StateModel.prefix('sk', identity.repoId),
    );

    if (!state) {
      return null;
    }

    const stateBase64 = await this.encryptionService.decrypt(state.attrs.encryptedState);

    return JSON.parse(Buffer.from(stateBase64, 'base64').toString('utf8'));
  };

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public saveState = async (identity: Identity, id: string, state: any): Promise<void> => {
    const stateBase64 = Buffer.from(JSON.stringify(state), 'utf8').toString('base64');
    const encryptedState = await this.encryptionService.encrypt(stateBase64);

    const lockedBy = crypto.createHash('sha256').update(identity.token, 'utf8').digest('base64');

    const [stateLocks] = await this.stateLockModel.model
      .query(StateLockModel.prefix('pk', identity.ownerId))
      .where('sk')
      .beginsWith(StateLockModel.prefix('sk', identity.repoId))
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
        `State is locked by ${identity.login} for ${identity.owner}/${
          identity.repo
        }. Lock expires at approximately ${moment(stateLock.attrs.expires * 1000).toISOString()}`,
      );
      throw new TerraformError(409, stateLock.attrs.request);
    }

    await this.stateModel.model.update({
      pk: StateModel.prefix('pk', identity.ownerId),
      sk: StateModel.prefix('sk', identity.repoId),
      ownerId: identity.ownerId,
      owner: identity.owner,
      repoId: identity.repoId,
      repo: identity.repo,
      encryptedState,
    });
  };

  public lockState = async (
    identity: Identity,
    stateLockRequest: StateLockRequest,
    duration = 30,
  ): Promise<void> => {
    const lockedBy = crypto.createHash('sha256').update(identity.token, 'utf8').digest('base64');

    const stateLock = await this.stateLockModel.model.get(
      StateLockModel.prefix('pk', identity.ownerId),
      StateLockModel.prefix('sk', `${identity.repoId}_${stateLockRequest.Path}`),
    );

    if (stateLock && stateLock.attrs.lockedBy !== lockedBy) {
      console.warn(
        `State is locked by ${identity.login} for ${identity.owner}/${
          identity.repo
        }. Lock expires at approximately ${moment(stateLock.attrs.expires * 1000).toISOString()}`,
      );
      throw new TerraformError(409, stateLock.attrs.request);
    }

    // TODO Catch overwrite exception
    await this.stateLockModel.model.create({
      pk: StateLockModel.prefix('pk', identity.ownerId),
      sk: StateLockModel.prefix('sk', `${identity.repoId}_${stateLockRequest.Path}`),
      ownerId: identity.ownerId,
      owner: identity.owner,
      repoId: identity.repoId,
      repo: identity.repo,
      id: stateLockRequest.ID,
      path: stateLockRequest.Path,
      lockedBy,
      request: stateLockRequest,
      expires: moment().add(duration, 'minute').unix(),
    });
  };

  // TODO Try this with the UNLOCK METHOD
  public unlockState = async (
    identity: Identity,
    stateLockRequest: StateLockRequest,
  ): Promise<void> => {
    const lockedBy = crypto.createHash('sha256').update(identity.token, 'utf8').digest('base64');

    const [stateLocks] = await this.stateLockModel.model
      .query(StateLockModel.prefix('pk', identity.ownerId))
      .where('sk')
      .beginsWith(StateLockModel.prefix('sk', identity.repoId))
      .filter('id')
      .eq(stateLockRequest.ID)
      .exec()
      .promise();

    if (!stateLocks || !stateLocks.Count) {
      console.log(
        `No state locks for ${identity.ownerId}/${identity.repoId} with id ${stateLockRequest.ID}`,
      );
      return;
    }

    const [stateLock] = stateLocks.Items;

    if (stateLock.attrs.lockedBy !== lockedBy) {
      console.warn(
        `State is locked by ${identity.login} for ${identity.owner}/${
          identity.repo
        }. Lock expires at approximately ${moment(stateLock.attrs.expires * 1000).toISOString()}`,
      );
      throw new TerraformError(409, stateLock.attrs.request);
    }

    await this.stateLockModel.model.destroy(stateLock.attrs.pk, stateLock.attrs.sk);
  };
}
