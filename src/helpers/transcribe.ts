import EventEmitter from "@/helpers/event";
import { type APIResponses } from "@/helpers/api";
import * as audiosdk from "microsoft-cognitiveservices-speech-sdk";

export type Transcription = Pick<
  APIResponses["sessionId"]["GET"]["transcripts"][number],
  "text" | "time"
> & {
  speaker?: "host" | "participant";
};

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
