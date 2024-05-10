import orm from "./schema";
import { type APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();

  if (body[0].data.validationCode) {
    const resp = { validationResponse: body[0].data.validationCode };
    return new Response(JSON.stringify(resp));
  }

  if (body[0].data.recordingStorageInfo && body[0].data.recordingId) {
    const serverRecordingId: string = body[0].data.recordingId;
    const videoURL: string =
      body[0].data.recordingStorageInfo.recordingChunks[0].contentLocation;

    if (
      videoURL &&
      serverRecordingId &&
      (await orm.session.findFirst({ where: { serverRecordingId } }))
    ) {
      const session = await orm.session.update({
        where: { serverRecordingId },
        data: { videoURL },
      });
      console.log(`Added session recording to: ${session.id}.`);
    }
  }

  return new Response(null, {
    status: 200,
  });
};
