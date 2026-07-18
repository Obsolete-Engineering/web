const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';
const REQUEST_TIMEOUT_MS = 10_000;

type Web3FormsResponse = {
  success?: boolean;
  message?: string;
};

export async function submitToWeb3Forms(
  payload: Record<string, string>,
  fetcher: typeof fetch = fetch,
) {
  const response = await fetcher(WEB3FORMS_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  let result: Web3FormsResponse;
  try {
    result = (await response.json()) as Web3FormsResponse;
  } catch {
    throw new Error(`Web3Forms returned an invalid response (${response.status}).`);
  }

  if (!response.ok || result.success !== true) {
    throw new Error(result.message || `Web3Forms rejected the submission (${response.status}).`);
  }
}
