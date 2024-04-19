import { Buffer } from "buffer";

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
  // Create video elements to play the streams
  const videoElements = [stream1, stream2, stream3].map((stream) => {
    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true; // Mute to avoid feedback when playing
    video.play(); // Start playing the video
    return video;
  });

  // Wait for all videos metadata to load to get dimensions
  await Promise.all(
    videoElements.map(
      (video) =>
        new Promise<void>((resolve) => {
          video.onloadedmetadata = () => resolve();
        })
    )
  );

  // Calculate the target height from the second and third video heights
  const targetHeight =
    videoElements[1].videoHeight + videoElements[2].videoHeight;

  // Calculate the new width for the first video to preserve its aspect ratio
  const aspectRatio1 =
    videoElements[0].videoWidth / videoElements[0].videoHeight;
  const newWidth1 = aspectRatio1 * targetHeight;

  // Set the canvas dimensions
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  canvas.width =
    newWidth1 +
    Math.max(videoElements[1].videoWidth, videoElements[2].videoWidth);
  canvas.height = targetHeight;

  // Function to draw the video frames onto the canvas
  function drawFrames() {
    if (videoElements.every((video) => !(video.paused || video.ended))) {
      // Clear the canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the first video on the left, scaled to the new width and target height
      context.drawImage(videoElements[0], 0, 0, newWidth1, targetHeight);

      // Draw the second video on the right, top
      context.drawImage(
        videoElements[1],
        newWidth1,
        0,
        videoElements[1].videoWidth,
        videoElements[1].videoHeight
      );

      // Draw the third video on the right, bottom
      context.drawImage(
        videoElements[2],
        newWidth1,
        videoElements[1].videoHeight,
        videoElements[2].videoWidth,
        videoElements[2].videoHeight
      );

      // Continue drawing frames
      requestAnimationFrame(drawFrames);
    }
  }

  // Start the drawing loop
  drawFrames();

  // Return the canvas's stream
  const combinedStream = canvas.captureStream();
  stream2.getAudioTracks().forEach((t) => combinedStream.addTrack(t));
  stream3.getAudioTracks().forEach((t) => combinedStream.addTrack(t));
  return combinedStream;
}

export async function initLocalCamera(size: number) {
  const video = {
    height: size,
    aspectRatio: 1,
    facingMode: "user",
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
  return await navigator.mediaDevices.getDisplayMedia({
    audio: false,
    video: true,
    preferCurrentTab: true,
  } as any);
}

export function recordStreamFor10Seconds(
  mediaRecorder: MediaRecorder
): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: BlobPart[] = [];

    mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const recordedBlob = new Blob(chunks, { type: mediaRecorder.mimeType });
      const objectURL = URL.createObjectURL(recordedBlob);
      resolve(objectURL);
    };

    mediaRecorder.onerror = (err) => {
      reject(err);
    };

    mediaRecorder.start();

    // Stop recording after 10 seconds
    setTimeout(() => {
      mediaRecorder.stop();
    }, 10000);
  });
}
