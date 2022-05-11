# Terraform State Storage Backend for GitHub Tokens

This is a REST API for storing Terraform State using a Terraform HTTP State.

Authentication and authorization is done using a GitHub token.

## Using this API

This API is publicly hosted at:

https://api.tfstate.dev/github/swagger.html

To use it in Terraform, please see the documentation here:

[TFstate.dev Homepage](https://tfstate.dev)

## Developing/Contributing to this API

We'd love contributions from the community to improve this API.

### Running

Requirements:

- NodeJS 14+
- Yarn

Running instructions:

1. Fork and clone this repo
1. Run `yarn`
1. Run `yarn start` (launches Serverless in Local mode)

The main controller is [`ControllerV1`](src/controllers/ControllerV1.ts). It contains the primary endpoints for State Storage.

Once running locally, the OpenAPI docs can be found at:

https://localhost:3000/github/swagger.html

### Verifying Locally

While running the API locally, create a basic Terraform structure to test state functions:

```hcl
terraform {
  backend "http" {
    address        = "http://localhost:3000/github/v1"
    lock_address   = "http://localhost:3000/github/v1/lock"
    unlock_address = "http://localhost:3000/github/v1/lock"
    lock_method    = "PUT"
    unlock_method  = "DELETE"

    # Make sure this is a real repository that your token has access to
    username       = "{your-github-user}/github-sls-rest-api"
  }
}

resource "null_resource" "example" {

}

output "null_resource_id" {
  value = null_resource.example.id
}
```

Then, run:

```bash
export TF_HTTP_PASSWORD={your-github-token}
terraform init
terraform plan
terraform apply
```

Other command to verify with:

```bash
terraform state ...
terraform force-unlock ...
```

## Contributing Guidelines

See [CONTRIBUTING](./CONTRIBUTING.md)

## Maintainers

- [cnuss](https://github.com/cnuss)
- [Scaffoldly](https://github.com/scaffoldly)

## License

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
