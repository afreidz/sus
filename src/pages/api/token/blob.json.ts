import {
  SASProtocol,
  AccountSASServices,
  AccountSASPermissions,
  AccountSASResourceTypes,
  StorageSharedKeyCredential,
  type AccountSASSignatureValues,
  generateAccountSASQueryParameters,
} from "@azure/storage-blob";

import type { APIRoute } from "astro";

export type blob = {
  GET: {
    token: string;
  };
};

const key = import.meta.env.AZURE_STORAGE_ACCOUNT_KEY;
const account = import.meta.env.PUBLIC_STORAGE_ACCOUNT;

export const GET: APIRoute = async () => {
  const token = await getToken();

  return new Response(JSON.stringify({ token }), {
    status: 200,
  });
};

export async function getToken() {
  const credential = new StorageSharedKeyCredential(account, key);
  const expiresOn = new Date(new Date().valueOf() + 3 * 60 * 60 * 1000); // 3 hours;

  const options: AccountSASSignatureValues = {
    expiresOn,
    protocol: SASProtocol.HttpsAndHttp,
    permissions: AccountSASPermissions.parse("racwd"),
    services: AccountSASServices.parse("btqf").toString(),
    resourceTypes: AccountSASResourceTypes.parse("sco").toString(),
  };

  const token = generateAccountSASQueryParameters(
    options,
    credential
  ).toString();

  return token;
}
