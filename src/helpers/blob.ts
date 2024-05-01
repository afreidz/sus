import { BlobServiceClient } from "@azure/storage-blob";

export async function uploadToContainer(sas: string, c: string, f: File) {
  const client = new BlobServiceClient(sas);
  const container = client.getContainerClient(c);

  await container.createIfNotExists({ access: "blob" });

  const block = container.getBlockBlobClient(f.name);
  const buffer = await f.arrayBuffer();
  await block.upload(buffer, buffer.byteLength, {
    blobHTTPHeaders: {
      blobContentType: "video/webm",
      blobContentDisposition: `inline; filename=${f.name}`,
    },
  });

  return block.url;
}
