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
