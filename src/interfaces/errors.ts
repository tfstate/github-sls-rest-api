import { TsoaResponse } from 'tsoa';

export class TerraformError extends Error {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  constructor(public statusCode: number, public body?: any) {
    super();
  }

  respond = (res: TsoaResponse<any, any>): any => {
    if (!this.body) {
      return res(this.statusCode, {});
    }

    return res(this.statusCode, this.body);
  };
}
