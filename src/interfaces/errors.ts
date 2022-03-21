import { Response } from 'express';

export class TerraformError extends Error {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  constructor(public statusCode: number, public body?: any) {
    super();
  }

  respond = (res: Response<any>): Response<any> => {
    if (!this.body) {
      return res.status(this.statusCode);
    }

    return res.status(this.statusCode).json(JSON.stringify(this.body));
  };
}
