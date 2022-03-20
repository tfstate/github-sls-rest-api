import { authorize } from '@scaffoldly/serverless-util';
import { env } from './env';

const DOMAIN = env['stage-domain'];

export const expressAuthentication = authorize(DOMAIN);
