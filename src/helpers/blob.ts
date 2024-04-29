import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

const account = import.meta.env.AZURE_STORAGE_ACCOUNT_NAME;
const key = import.meta.env.AZURE_STORAGE_ACCOUNT_KEY;

export async function uploadToContainer(c: string, f: File) {
  const credential = new StorageSharedKeyCredential(account, key);
  const client = new BlobServiceClient(
    `https://${account}.blob.core.windows.net`,
    credential
  );
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
