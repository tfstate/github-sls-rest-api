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
import { Controller, Get, Route, Tags } from 'tsoa';
import packageJson from '../../package.json';

export type HealthResponse = {
  name: string;
  healthy: boolean;
  now: Date;
  version: string;
};

@Route('/health')
@Tags('Health')
export class HealthController extends Controller {
  @Get()
  public async get(): Promise<HealthResponse> {
    return {
      name: packageJson.name,
      healthy: true,
      now: new Date(),
      version: packageJson.version,
    };
  }
}
