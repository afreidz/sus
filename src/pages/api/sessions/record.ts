import {
  type CallLocator,
  CallAutomationClient,
  type RecordingStateResult,
} from "@azure/communication-call-automation";

import orm, { RecordActionSchema } from "./schema";
import type { APIRoute } from "astro";
import { AzureKeyCredential } from "@azure/core-auth";

export type Recordings = {
  POST: Partial<RecordingStateResult>;
};

const key = import.meta.env.AZURE_COMS_KEY;
const endpoint = import.meta.env.AZURE_COMS_ENDPOINT;

const credential = new AzureKeyCredential(key);
const client = new CallAutomationClient(endpoint, credential);
const recordingDestinationContainerUrl = `https://${import.meta.env.PUBLIC_STORAGE_ACCOUNT}.blob.core.windows.net/participant-videos/`;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();

  const validation = await RecordActionSchema.safeParseAsync(body);

  if (!validation.success) throw validation.error;

  const data = validation.data;

  if (data.action === "start") {
    const callLocator: CallLocator = {
      id: data.serverCallId,
      kind: "serverCallLocator",
    };

    const resp = await client.getCallRecording().start({
      callLocator,
      pauseOnStart: false,
      recordingFormat: "mp4",
      recordingChannel: "mixed",
      recordingContent: "audioVideo",
      recordingStateCallbackEndpointUrl: new URL(
        "/api/sessions/events",
        import.meta.env.ORIGIN
      ).href,
      recordingStorage: {
        recordingDestinationContainerUrl,
        recordingStorageKind: "azureBlobStorage",
      },
    });

    await orm.session.update({
      where: { id: data.sessionId },
      data: {
        serverRecordingId: resp.recordingId,
      },
    });

    return new Response(JSON.stringify(resp), {
      status: 200,
    });
  } else if (body.action === "stop" && body.recordingId) {
    await client.getCallRecording().stop(body.recordingId);
    return new Response(JSON.stringify({}), {
      status: 200,
    });
  } else if (body.action === "status" && body.recordingId) {
    const resp = await client.getCallRecording().getState(body.recordingId);
    return new Response(JSON.stringify(resp), {
      status: 200,
    });
  } else {
    return new Response(
      JSON.stringify({ message: "unable to process request" }),
      { status: 400 }
    );
  }
};
