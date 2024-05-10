import api from "./api";
import { BlobServiceClient } from "@azure/storage-blob";

const maxDimension = import.meta.env.PUBLIC_IMG_MAX_WIDTH || 300;

export async function initMic() {
  const audio: MediaStreamConstraints["audio"] = {
    sampleRate: 128000,
    channelCount: 2,
  };

  const stream = await navigator.mediaDevices.getUserMedia({
    audio,
    video: false,
  });

  return stream;
}

export async function initLocalCamera(n: number) {
  const video: MediaStreamConstraints["video"] = {
    frameRate: 30,
    aspectRatio: 1,
    facingMode: "user",
    height: { ideal: n },
  };

  const audio: MediaStreamConstraints["audio"] = {
    sampleRate: 128000,
    channelCount: 2,
  };

  const stream = await navigator.mediaDevices.getUserMedia({
    audio,
    video,
  });

  return stream;
}

export async function initScreenShare() {
  const video: MediaStreamConstraints["video"] = {
    frameRate: 30,
    aspectRatio: 16 / 9,
    width: { ideal: 1280 },
  };

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video,
    audio: false,
    preferCurrentTab: true,
  } as any);

  return stream;
}

export async function combineCameraStreams(
  participant: MediaStream | MediaProvider,
  host: MediaStream | MediaProvider,
  targetHeight: number
): Promise<MediaStream> {
  // Create video elements to play the streams
  const participantVideo = document.createElement("video");
  const hostVideo = document.createElement("video");
  participantVideo.srcObject = participant;
  hostVideo.srcObject = host;

  // Play both video elements
  await Promise.all([participantVideo.play(), hostVideo.play()]);

  // Calculate new widths based on the target height while preserving aspect ratios
  const participantAspectRatio =
    participantVideo.videoWidth / participantVideo.videoHeight;
  const hostAspectRatio = hostVideo.videoWidth / hostVideo.videoHeight;

  const participantWidth = targetHeight * participantAspectRatio;
  const hostWidth = targetHeight * hostAspectRatio;

  // Set the canvas size
  const canvas = document.createElement("canvas");
  canvas.width = participantWidth + hostWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d");

  // Function to draw video frames on the canvas
  function drawFrames() {
    if (
      !participantVideo.paused &&
      !participantVideo.ended &&
      !hostVideo.paused &&
      !hostVideo.ended
    ) {
      // Clear the canvas
      context?.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the videos on canvas with new dimensions
      context?.drawImage(
        participantVideo,
        0,
        0,
        participantWidth,
        targetHeight
      );
      context?.drawImage(
        hostVideo,
        participantWidth,
        0,
        hostWidth,
        targetHeight
      );

      // Continue drawing frames
      requestAnimationFrame(drawFrames);
    }
  }

  drawFrames();

  // Return the canvas's stream
  return canvas.captureStream();
}

export async function captureImageFromStream(
  stream: MediaStream | MediaProvider
) {
  // Create a video element to capture a frame
  const video = document.createElement("video");
  video.autoplay = true;
  video.srcObject = stream;

  await new Promise((r) => (video.onloadedmetadata = r));

  video.width = video.videoWidth;
  video.height = video.videoHeight;

  // Use a canvas to capture a frame from the video stream
  const canvas = document.createElement("canvas");
  canvas.width = 300; // set size to 300x300
  canvas.height = 300;
  const ctx = canvas.getContext("2d");

  // Wait to make sure video is streaming
  await new Promise((r) => setTimeout(r, 2000));

  // Draw the video frame to the canvas, scaling it down
  ctx?.drawImage(
    video,
    0,
    0,
    video.videoWidth,
    video.videoHeight,
    0,
    0,
    300,
    300
  );

  const blob = await new Promise<Blob | null>((r) =>
    canvas.toBlob((blob) => r(blob), "image/jpeg")
  );

  if (!blob) throw new Error("Unable to extract image from media stream");

  return blob;
}

export async function uploadImageToStorage(
  blob: Blob,
  container: string,
  name: string,
  type: string = "image/jpeg"
) {
  const { token } = await api({ endpoint: "blobToken" });

  // Construct the full URI to the Azure Blob Service
  const blobServiceClient = new BlobServiceClient(
    `https://${import.meta.env.PUBLIC_STORAGE_ACCOUNT}.blob.core.windows.net?${token}`
  );

  // Get a reference to a container and the blob
  const client = blobServiceClient.getContainerClient(container);
  if (!client.exists) await client.createIfNotExists({ access: "blob" });
  const block = client.getBlockBlobClient(name);

  await block.uploadData(blob, {
    blobHTTPHeaders: {
      blobContentType: type,
    },
  });

  return block.url.split("?")[0];
}

export function convertImageToResizedBlob(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Create an image element
    const img = new Image();

    // Create a file reader to read the file into an image src
    const reader = new FileReader();
    reader.onload = (e) => (img.src = e.target?.result as string);
    reader.readAsDataURL(file);

    // When the image is loaded, resize it
    img.onload = () => {
      // Get the scaling factor to preserve aspect ratio
      const scalingFactor = Math.min(
        maxDimension / img.width,
        maxDimension / img.height,
        1
      );

      // Calculate the resized dimensions
      const width = scalingFactor * img.width;
      const height = scalingFactor * img.height;

      // Draw the resized image onto a canvas
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, width, height);

      // Convert the canvas to a blob
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Canvas to Blob conversion failed"));
        }
      }, file.type);
    };

    // Handle any errors in reading the file
    reader.onerror = (error) => reject(error);
    img.onerror = () => reject(new Error("Image loading failed"));
  });
}
