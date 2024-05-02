import api from "./api";
import { nanoid } from "nanoid";
import type { Transcription } from "@/stores/session";
import * as audiosdk from "microsoft-cognitiveservices-speech-sdk";
import { type BlobHTTPHeaders, BlobServiceClient } from "@azure/storage-blob";

const maxDimension = import.meta.env.PUBLIC_IMG_MAX_WIDTH || 300;
const timeslice = 5000;

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
    video.muted = true;
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

  const audioContext = new AudioContext();
  const dest = audioContext.createMediaStreamDestination();

  [host, participant].forEach((stream) => {
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(dest);
  });

  // Combine the video from the canvas with the audio from the destinations
  const videoStream = (canvas.captureStream(30) as any).getVideoTracks();
  const outputStream = new MediaStream([
    ...videoStream,
    ...dest.stream.getAudioTracks(),
  ]);

  // To ensure no audio plays in the output, we can avoid linking the audio to any element,
  // or explicitly set the video element to muted if necessary.
  return outputStream;
}

export function mute(s: MediaStream) {
  const clone = s.clone();
  clone.getAudioTracks().forEach((t) => t.stop());
  return clone;
}

class EventEmitter {
  private events: { [event: string]: Array<(arg: any) => void> } = {};

  public on(event: string, listener: (arg: any) => void): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  public emit(event: string, arg?: any): void {
    const listeners = this.events[event];
    if (listeners) {
      listeners.forEach((listener) => listener(arg));
    }
  }
}

export class SessionTranscriber extends EventEmitter {
  public transcribing: boolean;
  private transcriber: audiosdk.SpeechRecognizer;
  private config: ReturnType<typeof audiosdk.SpeechConfig.fromSubscription>;

  constructor() {
    super();
    this.config = audiosdk.SpeechConfig.fromSubscription(
      import.meta.env.PUBLIC_SPEECH_KEY,
      import.meta.env.PUBLIC_SPEECH_REGION
    );

    this.config.speechRecognitionLanguage = "en-US";

    const audio = audiosdk.AudioConfig.fromDefaultMicrophoneInput();
    const transcriber = new audiosdk.SpeechRecognizer(this.config, audio);

    this.transcribing = false;
    this.transcriber = transcriber;
    this.transcriber.recognized = (_, e) => this.handler(e);
  }

  private handler(e: audiosdk.SpeechRecognitionEventArgs) {
    this.emit("speech", {
      time: new Date(),
      text: e.result.text,
    } as Transcription);
  }

  public start(): void {
    if (!this.transcribing) this.transcriber.startContinuousRecognitionAsync();
    console.log("Transcriber started");
    this.emit("start");
  }

  public stop(): void {
    this.transcriber.stopContinuousRecognitionAsync();
    console.log("Transcriber stopped");
    this.emit("stop", {});
  }
}

export async function recordSessionStream(
  recorder: MediaRecorder,
  session: string
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const blocks: {
      id: string;
      promise: Promise<any>;
    }[] = [];

    const { token } = await api({
      endpoint: "blobToken",
    });

    const name = `${session}-${+new Date()}.webm`;
    const uri = `https://${import.meta.env.PUBLIC_STORAGE_ACCOUNT}.blob.core.windows.net?${token}`;
    const serviceClient = new BlobServiceClient(uri);
    const container = serviceClient.getContainerClient("participant-videos");

    await container.createIfNotExists({ access: "blob" });
    const block = container.getBlockBlobClient(name);

    const headers: BlobHTTPHeaders = {
      blobContentType: "video/webm",
      blobContentDisposition: `inline; filename="${name}"`,
    };

    recorder.onerror = (event) => reject(event);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        const id = window.btoa(nanoid());
        blocks.push({
          id,
          promise: block.stageBlock(id, event.data, event.data.size),
        });
      }
    };

    recorder.onstop = async () => {
      await Promise.all(blocks.map((b) => b.promise));
      await block.commitBlockList(
        blocks.map((b) => b.id),
        {
          blobHTTPHeaders: headers,
        }
      );
      resolve(block.url.split("?")[0]);
    };

    recorder.start(timeslice);
  });
}

export async function captureImageFromStream(stream: MediaStream) {
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
  await client.createIfNotExists({ access: "blob" });
  const block = client.getBlockBlobClient(name);

  await block.uploadData(blob, {
    blobHTTPHeaders: {
      blobContentType: type,
    },
  });

  return block.url.split("?")[0];
}
