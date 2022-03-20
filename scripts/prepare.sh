#!/usr/bin/env bash

set -e
set -x

yarn dotenv
yarn openapi

yarn types
yarn dynamodb

yarn tsoa
yarn build
