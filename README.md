# Terraform State Storage HTTP Backend

**TFstate.dev** is a free [Terraform State Provider](https://www.terraform.io/language/settings/backends/http) and [Open Source Hosted Service](https://github.com/tfstate/github-sls-rest-api) for secure Terraform Remote State hosting using a GitHub Token, courtsey of [Scaffoldly](https://scaffold.ly)

Features:

- GitHub Token used for Authentication and Authorization to Terraform State
- Encrypted State in Amazon S3 using Amazon KMS
- State Locking
- Highly available [Hosted API](https://api.tfstate.dev/github/swagger.html) in AWS Lambda + API Gateway
- Plug and Play: Only a GitHub Token is needed to use TFstate.dev

✅ We do not store or save the provided GitHub token.

---

## Getting started 🚀

First, a GitHub token is needed. This can be a [Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token), a [GitHub Actions Secret](https://docs.github.com/en/actions/security-guides/automatic-token-authentication), or any other form of [GitHub Oauth Token](https://github.blog/2021-04-05-behind-githubs-new-authentication-token-formats/). At a minimum, the token needs `repo:read` access for the configured repository.

➡ See our [example repository](https://github.com/tfstate/example).

To use TFstate.dev in Terraform, add the following [backend configuration](https://www.terraform.io/language/settings/backends/http) to Terraform:

```hcl
terraform {
  backend "http" {
    address        = "https://api.tfstate.dev/github/v1"
    lock_address   = "https://api.tfstate.dev/github/v1/lock"
    unlock_address = "https://api.tfstate.dev/github/v1/lock"
    lock_method    = "PUT"
    unlock_method  = "DELETE"
    username       = "{your-github-org}/{your-github-repo}"
  }
}
```

Then, Terraform can be configured to use the TFstate.dev backend using the GitHub token:

```bash
terraform init -backend-config="password={your-github-token}"
terraform plan
terraform apply
```

Alternatively, the `TF_HTTP_PASSWORD` environment variable can be set with the GitHub token:

```bash
export TF_HTTP_PASSWORD="{your-github-token}"
terraform init
terraform plan
terraform apply
```

For more information go to [TFstate.dev](https://tfstate.dev)!

---

## Want to Contribute?

### Developing/Contributing to this API

We'd love contributions from the community to improve this API.

#### Running

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

#### Verifying Locally

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

![](https://sly-dev.scaffold.ly/auth/px?tfstate-github-readme)
