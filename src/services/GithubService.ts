import { HttpError, HttpRequest } from '@scaffoldly/serverless-util';
import { Octokit } from '@octokit/rest';
import { TerraformError } from '../interfaces/errors';

export type Identity = {
  login: string;
  owner: string;
  ownerId: number;
  repo: string;
  repoId: number;
  token: string;
};

const lowerCase = (str?: string): string | undefined => {
  if (!str) {
    return undefined;
  }

  return str.toLowerCase();
};

export class GithubService {
  public getIdentity = async (request: HttpRequest): Promise<Identity> => {
    const { authorization } = request.headers;
    if (!authorization) {
      throw new HttpError(401, 'Unauthorized');
    }

    const [method, token] = authorization.split(' ');

    if (!method || !token) {
      throw new TerraformError(400);
    }

    if (lowerCase(method) !== 'basic') {
      console.warn(`Method ${method} is not 'basic'`);
      throw new TerraformError(400);
    }

    const decoded = Buffer.from(token, 'base64').toString('utf8');

    const [username, password] = decoded.split(':');
    let owner: string | undefined;
    let repo: string | undefined;

    if (!password) {
      console.warn(`Missing password from authorization token`);
      throw new TerraformError(400);
    }

    if (username) {
      [owner, repo] = username.split('/');
      if (!owner || !repo) {
        console.warn(`Username must be in the format of \`{owner}/{repository}\``);
        throw new TerraformError(400);
      }
    }

    try {
      const identity = await this.inferIdentity(password, owner, repo);

      console.log(
        `Using identity: ${identity.owner}/${identity.repo} [${identity.ownerId}/${identity.repoId}]`,
      );

      return identity;
    } catch (e) {
      if (e instanceof Error) {
        console.warn(`Error inferring identity`, e.message);
        throw new TerraformError(401);
      }
      throw e;
    }
  };

  private inferIdentity = async (
    auth: string,
    owner?: string,
    repo?: string,
  ): Promise<Identity> => {
    console.log(
      `Inferring identity (auth: ${auth.substring(0, 10)} owner: ${owner}, repo: ${repo})`,
    );

    const octokit = new Octokit({ auth });

    const { data: authenticated } = await octokit.users.getAuthenticated();

    const repositories =
      auth.startsWith('ghs_') && !owner && !repo
        ? (await octokit.paginate(octokit.apps.listReposAccessibleToInstallation)).repositories
        : [];

    const repository = repositories.length === 1 ? repositories[0] : undefined;

    if (repository && !owner && !repo) {
      return {
        login: authenticated.login,
        owner: repository.owner.login,
        ownerId: repository.owner.id,
        repo: repository.name,
        repoId: repository.id,
        token: auth,
      };
    }

    if (
      repository &&
      lowerCase(owner) === lowerCase(repository.owner.login) &&
      lowerCase(repo) === lowerCase(repository.name)
    ) {
      return {
        login: authenticated.login,
        owner: repository.owner.login,
        ownerId: repository.owner.id,
        repo: repository.name,
        repoId: repository.id,
        token: auth,
      };
    }

    if (owner && repo) {
      console.log(`Fetching repository ${owner}/${repo}`);
      const data = await octokit.repos.get({ owner, repo });
      return {
        login: authenticated.login,
        owner: data.data.owner.login,
        ownerId: data.data.owner.id,
        repo: data.data.name,
        repoId: data.data.id,
        token: auth,
      };
    }

    console.warn(`Unable to infer repository (auth: ${auth.substring(0, 10)}`);

    throw new Error(
      `Unable to determine owner and/or repository from token privileges. Ensure \`username\` is in the format of \`{owner}/{repository}\`, and the provided \`password\` (a GitHub token) has access to that repository.`,
    );
  };
}
