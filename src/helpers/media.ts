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

export async function combineMediaStreams(
  screen: MediaStream,
  participant: MediaStream,
  host: MediaStream
) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const videoElements = [screen, participant, host].map((stream) => {
    const video = document.createElement("video");
    video.srcObject = stream;
    video.play();
    return video;
  });

  // Wait for all video metadata to load
  await Promise.all(
    videoElements.map((video) => {
      return new Promise((resolve) => {
        video.onloadedmetadata = () => resolve(true);
      });
    })
  );

  // Calculate sizes and positions
  const targetHeight = 720;
  const targetWidth1 =
    videoElements[0].videoWidth / (videoElements[0].videoHeight / targetHeight);
  const halfHeight = targetHeight / 2;
  const aspectRatio2 =
    videoElements[1].videoWidth / videoElements[1].videoHeight;
  const aspectRatio3 =
    videoElements[2].videoWidth / videoElements[2].videoHeight;
  const targetWidth2 = halfHeight * aspectRatio2;
  const targetWidth3 = halfHeight * aspectRatio3;

  // Set canvas size
  canvas.width = targetWidth1 + Math.max(targetWidth2, targetWidth3);
  canvas.height = targetHeight;

  // Start the rendering loop
  function draw() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the streams on the canvas
    ctx.drawImage(videoElements[0], 0, 0, targetWidth1, targetHeight); // Left side
    ctx.drawImage(videoElements[1], targetWidth1, 0, targetWidth2, halfHeight); // Right top
    ctx.drawImage(
      videoElements[2],
      targetWidth1,
      halfHeight,
      targetWidth3,
      halfHeight
    ); // Right bottom

    requestAnimationFrame(draw);
  }

  draw();

  // Return the canvas's stream
  const combinedStream = canvas.captureStream(30);
  participant.getAudioTracks().forEach((t) => combinedStream.addTrack(t));
  host.getAudioTracks().forEach((t) => combinedStream.addTrack(t));
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

  const file =
    recordings.length === 1 && recordings[0].file
      ? recordings[0].file
      : await zip.generateAsync({ type: "blob" });

  // Create an object URL for the file
  const url = URL.createObjectURL(file);

  // Create a temporary anchor element and trigger a download
  const a = document.createElement("a");
  a.href = url;
  a.download =
    recordings.length === 1
      ? "session_recording.webm"
      : "session_recordings.zip";
  document.body.appendChild(a); // Append to the body temporarily
  a.click(); // Trigger the download

  // Clean up by removing the element and revoking the object URL
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
