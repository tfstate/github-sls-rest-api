import {
  corsHandler,
  CorsOptions,
  createApp,
  errorHandler,
  registerDocs,
  registerVersion,
} from '@scaffoldly/serverless-util';
import express, { NextFunction, Request, Response } from 'express';
import { readFileSync } from 'fs';
import packageJson from '../package.json';
import { TerraformError } from './interfaces/errors';
import { RegisterRoutes } from './routes';

export function terraformErrorHandler(version: string) {
  return (err: Error | any, req: Request, res: Response, next: NextFunction): Response | void => {
    if (err instanceof TerraformError) {
      err.respond(res);
      next();
      return;
    }

    return errorHandler(version)(err, req, res, next);
  };
}

import swaggerJson from './swagger.json';

const app = createApp({ logHeaders: true });

const corsOptions: CorsOptions = {};

app.use(corsHandler(corsOptions));

RegisterRoutes(app);

app.use(terraformErrorHandler(packageJson.version));

registerDocs(app, swaggerJson);
registerVersion(app, packageJson.version);

app.get('/swagger.html', (_req: express.Request, res: express.Response) => {
  const file = readFileSync('./public/swagger.html');
  res.type('html');
  res.send(file);
});

export default app;
