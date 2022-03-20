import { Example } from '../models/interfaces';

export type ExampleRequest = {
  value?: string;
};

export type ExampleResponse = Example;

export type ExampleListResponse = {
  results: Example[];
  count: number;
  total: number;
  next?: {
    pk: string;
    sk: string;
  };
};
