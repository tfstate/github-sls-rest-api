# Terraform Remote State Management using a GitHub Token

[Scaffoldly](https://scaffold.ly) provides [a remote state backend]() for secure
Terraform State hosting using a GitHub Token.

Features:

- Zero Bootstrapping: if you have a GitHub token, you can use this API
- [Hosted API](https://api.tfstate.dev/github/swagger.html) in AWS Lambda + API
  Gateway in AWS courtsey of [Scaffoldly](https://scaffold.ly)
- [Encrypted State](src/services/StateService.ts#L27)
- State Locking

✅ We do not store or save the provided GitHub token.

## Usage

### 1. Create a `tfstate.tfbackend` file with a GitHub Token with `repo` or `repo:read` access to the Repository specified by `username`:

```hcl
username = "my-org/my-repo"
password = "ghp_abcd..."
```

_Note_: Be sure to exclude this file from source control in the `.gitignore`.
_Note_: This can be a Personal Access Token or a token generated by GitHub OAuth

### 2. Configure Terraform for Remote State

```hcl
terraform {
  backend "http" {
    address        = "https://api.tfstate.dev/github/v1"
    lock_address   = "https://api.tfstate.dev/github/v1/lock"
    unlock_address = "https://api.tfstate.dev/github/v1/lock"
    lock_method    = "PUT"
    unlock_method  = "DELETE"
  }
}
```

### 3. Initialize Terraform

```bash
terraform init -backend-config=tfstate.tfbackend -reconfigure [-migrate-state]
```

_Note_: If you have a token that rotates regularly (such as Server-to-Server) tokens
generated by a GitHub Application, you will need to run `-reconfigure` each time
the token rotates.

See the [Terraform Docs](https://www.terraform.io/cli/commands/init#backend-initialization)
for specifics on migrating existing state.

# Questions/Comments/Issues?

Please create a [new issue](https://github.com/tfstate/github-sls-rest-api/issues/new/choose)
on GitHub.

# Maintainers

- [cnuss](https://github.com/cnuss)
- [Scaffoldly](https://github.com/scaffoldly)

# About Scaffoldly and `tfstate.dev`

[Scaffoldly](https://scaffold.ly) provides various services and automations to
simplify Infrastructure Bootstrapping and DevOps.

`tfstate.dev` is provided as a free and easy way to store Terraform State. We've
open sourced it for transparency to show how we handlea and secure state access
and storage. We were inspired by GitLab's ability to host Terraform State, and
wanted the same functionality for GitHub.

Scaffoldly is not affiliated with GitHub.

## Want to host your own personal State Storage API?

Scaffoldly can help you host it in your own AWS Account!

[Message us on Gitter](https://gitter.im/scaffoldly/community) for details.
