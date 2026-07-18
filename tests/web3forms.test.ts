import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { submitToWeb3Forms } from '../src/lib/web3forms';

const payload = {
  access_key: 'test-access-key',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'An ambitious analytical engine experience.',
};

describe('submitToWeb3Forms', () => {
  test('posts a JSON submission to the Web3Forms endpoint', async () => {
    let request: Request | undefined;
    const fetcher = ((input: RequestInfo | URL, init?: RequestInit) => {
      request = new Request(input, init);
      return Promise.resolve(Response.json({ success: true, message: 'Submission received.' }));
    }) as typeof fetch;

    await submitToWeb3Forms(payload, fetcher);

    assert.equal(request?.url, 'https://api.web3forms.com/submit');
    assert.equal(request?.method, 'POST');
    assert.equal(request?.headers.get('accept'), 'application/json');
    assert.equal(request?.headers.get('content-type'), 'application/json');
    assert.deepEqual(await request?.json(), payload);
  });

  test('rejects unsuccessful Web3Forms responses', async () => {
    const fetcher = (() =>
      Promise.resolve(
        Response.json({ success: false, message: 'Invalid access key.' }, { status: 400 }),
      )) as typeof fetch;

    await assert.rejects(submitToWeb3Forms(payload, fetcher), /Invalid access key\./u);
  });

  test('rejects malformed Web3Forms responses', async () => {
    const fetcher = (() =>
      Promise.resolve(new Response('<h1>Forbidden</h1>', { status: 403 }))) as typeof fetch;

    await assert.rejects(
      submitToWeb3Forms(payload, fetcher),
      /Web3Forms returned an invalid response \(403\)\./u,
    );
  });
});
