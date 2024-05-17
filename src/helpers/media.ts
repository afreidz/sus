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
  mediaStream: MediaStream | MediaProvider
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Create a video element to play the MediaStream
    const video: HTMLVideoElement = document.createElement("video");
    video.srcObject = mediaStream;
    video.play(); // Start playing the video

    // When the video metadata is loaded, draw a frame to the canvas
    video.onloadedmetadata = () => {
      // Use the native video width and height for the canvas
      const width = video.videoWidth;
      const height = video.videoHeight;

      // Create a canvas element with the video dimensions
      const canvas: HTMLCanvasElement = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (context) {
        // Draw the entire video frame to the canvas
        context.drawImage(video, 0, 0, width, height);

        // Convert the canvas to a JPEG blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas to Blob conversion failed"));
          }
        }, "image/jpeg");
      } else {
        reject(new Error("Failed to get 2D context"));
      }

      // Pause and reset the video element to clean up
      video.pause();
      video.currentTime = 0;
      video.srcObject = null;
    };

    // Handle video errors
    video.onerror = (event: Event | string) => {
      console.error("Video error:", event);
      reject(new Error(`An error occurred while playing the video: ${event}`));
    };
  });
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

async function cropToSquare(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Create an image to load the blob
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      // Get the smallest dimension to make a square
      const size = Math.min(img.width, img.height);

      // Create a canvas element
      const canvas: HTMLCanvasElement = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;

      const context = canvas.getContext("2d");
      if (context) {
        // Calculate the center position to crop the image into a square
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;

        // Draw the cropped image from the center
        context.drawImage(img, startX, startY, size, size, 0, 0, size, size);

        // Convert the canvas to a JPEG blob
        canvas.toBlob((croppedBlob) => {
          if (croppedBlob) {
            resolve(croppedBlob);
          } else {
            reject(new Error("Canvas to Blob conversion failed"));
          }
        }, "image/jpeg");
      } else {
        reject(new Error("Failed to get 2D context"));
      }

      // Clean up the object URL
      URL.revokeObjectURL(url);
    };

    img.onerror = () => {
      reject(new Error("Image loading failed"));
      // Clean up the object URL even on error
      URL.revokeObjectURL(url);
    };

    // Start loading the image
    img.src = url;
  });
}

export function generateBase64FromSVG(svgElement: SVGSVGElement): {
  aspect: number;
  data: string;
} {
  const box = svgElement.getBoundingClientRect();
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  const base64 = window.btoa(unescape(encodeURIComponent(svgString)));

  return {
    aspect: box.height / box.width,
    data: `data:image/svg+xml;base64,${base64}`,
  };
}

export async function captureImageFromVideo(
  videoElem: HTMLVideoElement
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Ensure that the video element is not null and has valid video dimensions
    if (
      !videoElem ||
      videoElem.videoWidth === 0 ||
      videoElem.videoHeight === 0
    ) {
      reject(new Error("Invalid video element or video dimensions."));
      return;
    }

    // Create a canvas element
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.width = videoElem.videoWidth;
    canvas.height = videoElem.videoHeight;

    const context = canvas.getContext("2d");
    if (context) {
      // Draw the video frame to the canvas
      context.drawImage(
        videoElem,
        0,
        0,
        videoElem.videoWidth,
        videoElem.videoHeight
      );

      // Convert the canvas to a JPEG blob
      canvas.toBlob(async (blob) => {
        if (blob) {
          resolve(await cropToSquare(blob));
        } else {
          reject(new Error("Canvas to Blob conversion failed."));
        }
      }, "image/jpeg");
    } else {
      reject(new Error("Failed to get 2D context."));
    }
  });
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
