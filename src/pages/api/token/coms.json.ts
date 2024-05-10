import type { APIRoute } from "astro";
import { AzureKeyCredential } from "@azure/core-auth";
import { CommunicationIdentityClient } from "@azure/communication-identity";
import type { CommunicationUserIdentifier } from "@azure/communication-common";

export type coms = {
  GET: {
    token: string;
    expiresOn: string;
    user: CommunicationUserIdentifier;
  };
};

const key = import.meta.env.AZURE_COMS_KEY;
const endpoint = import.meta.env.AZURE_COMS_ENDPOINT;

export const GET: APIRoute = async () => {
  const credential = new AzureKeyCredential(key);
  const client = new CommunicationIdentityClient(endpoint, credential);

  const { token, expiresOn, user } = await client.createUserAndToken(["voip"]);

  return new Response(JSON.stringify({ token, expiresOn, user }), {
    status: 200,
  });
};
