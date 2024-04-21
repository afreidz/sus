import JSZip from "jszip";
import { Buffer } from "buffer";
import type { SessionRecording } from "@/stores/session";

const maxWidth = import.meta.env.PUBLIC_IMG_MAX_WIDTH || 300;

export function fileToResizedDataURI(imageFile: File) {
  return new Promise<string>((r, x) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!e.target?.result) return x();

      const img = document.createElement("img");
      img.onload = function () {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) return x();

        const aspect =
          img.width > img.height
            ? img.height / img.width
            : img.width / img.height;
        const w = Math.min(maxWidth, img.width);
        const h = w * aspect;

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        r(canvas.toDataURL(imageFile.type));
      };
      img.src = e.target.result as string;
    };
    reader.readAsDataURL(imageFile);
  });
}

export function dataURItoBuffer(dataURI?: string): Buffer | null {
  if (!dataURI) return null;

  const base64 = dataURI.split(",")[1];
  return Buffer.from(base64, "base64");
}

export function bufferToDataUri(
  mimeType: string,
  array: ArrayBufferLike
): string {
  const buffer = Buffer.from(array);
  let base64 = buffer.toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

export async function combineCameraStreams(
  stream1: MediaStream,
  stream2: MediaStream,
  targetHeight: number
): Promise<MediaStream> {
  // Create video elements to play the streams
  const videoElement1 = document.createElement("video");
  const videoElement2 = document.createElement("video");
  videoElement1.srcObject = stream1;
  videoElement2.srcObject = stream2;

  // Play both video elements
  await Promise.all([videoElement1.play(), videoElement2.play()]);

  // Calculate new widths based on the target height while preserving aspect ratios
  const aspectRatio1 = videoElement1.videoWidth / videoElement1.videoHeight;
  const aspectRatio2 = videoElement2.videoWidth / videoElement2.videoHeight;

  const newWidth1 = targetHeight * aspectRatio1;
  const newWidth2 = targetHeight * aspectRatio2;

  // Set the canvas size
  const canvas = document.createElement("canvas");
  canvas.width = newWidth1 + newWidth2;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d");

  // Function to draw video frames on the canvas
  function drawFrames() {
    if (
      !videoElement1.paused &&
      !videoElement1.ended &&
      !videoElement2.paused &&
      !videoElement2.ended
    ) {
      // Clear the canvas
      context?.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the videos on canvas with new dimensions
      context?.drawImage(videoElement1, 0, 0, newWidth1, targetHeight);
      context?.drawImage(videoElement2, newWidth1, 0, newWidth2, targetHeight);

      // Continue drawing frames
      requestAnimationFrame(drawFrames);
    }
  }

  drawFrames();

  // Return the canvas's stream
  return canvas.captureStream();
}

export async function combineAllStreams(
  stream1: MediaStream,
  stream2: MediaStream,
  stream3: MediaStream
): Promise<MediaStream> {
  const videos = await Promise.all(
    [stream1, stream2, stream3].map(async (stream, index) => {
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      video.play();
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
      });
      // For the third stream, we need to load data to get the height
      if (index === 2) {
        await new Promise<void>((resolve) => {
          video.onloadeddata = () => resolve();
        });
      }
      return video;
    })
  );

  const targetHeight = videos[2].videoHeight * 2;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;

  // Calculate scaled dimensions
  const scaledWidth1 =
    videos[0].videoWidth * (targetHeight / videos[0].videoHeight);
  const scaledWidth23 = videos[2].videoWidth; // Second and third video widths will be the same

  // Set canvas dimensions
  canvas.width = scaledWidth1 + scaledWidth23;
  canvas.height = targetHeight;

  function draw() {
    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the first video
    context.drawImage(videos[0], 0, 0, scaledWidth1, targetHeight);

    // Draw the second video (scaled to the size of the third video)
    context.drawImage(
      videos[1],
      scaledWidth1,
      0,
      scaledWidth23,
      videos[2].videoHeight
    );

    // Draw the third video below the second
    context.drawImage(
      videos[2],
      scaledWidth1,
      videos[2].videoHeight,
      scaledWidth23,
      videos[2].videoHeight
    );

    // Continue drawing frames
    requestAnimationFrame(draw);
  }

  // Start rendering the canvas
  draw();

  // Return the canvas's stream
  const combinedStream = canvas.captureStream();
  stream2.getAudioTracks().forEach((t) => combinedStream.addTrack(t));
  stream3.getAudioTracks().forEach((t) => combinedStream.addTrack(t));
  return combinedStream;
}

export async function initLocalCamera(size: number) {
  const video: MediaStreamConstraints["video"] = {
    frameRate: 30,
    aspectRatio: 1,
    facingMode: "user",
    height: { ideal: size },
  };

  const muted = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video,
  });

  const unmuted = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video,
  });

  return { muted, unmuted };
}

export async function initScreenShare() {
  const video: MediaStreamConstraints["video"] = {
    frameRate: 30,
    aspectRatio: 16 / 9,
    width: { ideal: 1280 },
  };

  return await navigator.mediaDevices.getDisplayMedia({
    video,
    audio: false,
    preferCurrentTab: true,
  } as any);
}

export async function downloadSessionVideos(recordings: SessionRecording[]) {
  const zip = new JSZip();

  recordings.forEach((recording) => {
    if (!recording.file) return;
    zip.file(recording.file.name, recording.file);
  });

  const finalZip = await zip.generateAsync({ type: "blob" });

  // Create an object URL for the file
  const url = URL.createObjectURL(finalZip);

  // Create a temporary anchor element and trigger a download
  const a = document.createElement("a");
  a.href = url;
  a.download = "session_recordings.zip";
  document.body.appendChild(a); // Append to the body temporarily
  a.click(); // Trigger the download

  // Clean up by removing the element and revoking the object URL
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
