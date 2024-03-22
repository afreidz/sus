export async function fileToByteArray(f: File) {
  const buffer = await f.arrayBuffer();
  return new Int8Array(buffer);
}

export function arrayToDataUri(
  array: Int8Array,
  mime: string = "image/png"
): string {
  let binary = "";
  const bytes = new Uint8Array(array);
  const len = bytes.byteLength;

  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return `data:${mime};base64,` + window.btoa(binary);
}

export function dataURItoBuffer(dataURI: string, mimeType: string): Buffer {
  // Check if the provided dataUri has the expected mimeType at the beginning
  const expectedHeader = `data:${mimeType};base64,`;

  if (!dataURI.startsWith(expectedHeader)) {
    throw new Error(
      `The provided dataUri does not seem to represent a ${mimeType}`
    );
  }

  // Strip the mimeType prefix and parse the rest as base64
  const base64 = dataURI.slice(expectedHeader.length);

  // Convert base64 to a buffer
  const buffer = Buffer.from(base64, "base64");

  return buffer;
}

export function dataURItoInt8Array(
  dataURI: string,
  mimeType: string
): Int8Array {
  // Check if the provided dataUri has the expected mimeType at the beginning
  const expectedHeader = `data:${mimeType};base64,`;

  if (!dataURI.startsWith(expectedHeader)) {
    throw new Error(
      `The provided dataUri does not seem to represent a ${mimeType}`
    );
  }

  // Strip the mimeType prefix and parse the rest as base64
  const base64 = dataURI.slice(expectedHeader.length);

  // Decode base64 string
  const binary = atob(base64);

  // Create a buffer to hold the binary
  const buffer = new ArrayBuffer(binary.length);

  // Create a view on the buffer as a 8-bit integer array
  const intArray = new Int8Array(buffer);

  // Set the bytes on the array from the binary string
  for (let i = 0; i < binary.length; i++) {
    intArray[i] = binary.charCodeAt(i);
  }

  return intArray;
}

export function int8ArrayToBuffer(array: Int8Array): Buffer {
  return Buffer.from(array.buffer);
}
