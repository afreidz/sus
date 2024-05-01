import * as audiosdk from "microsoft-cognitiveservices-speech-sdk";

type StartMessage = {
  type: "start";
};

type StopMessage = {
  type: "stop";
};

type SpeechMessage = {
  type: "speech";
  transcription: {
    text: string;
    time: Date;
    speaker?: "host" | "participant";
  };
};

type SourceMessage = {
  type: "source";
  audio: audiosdk.AudioConfig;
};

export type TranscriberMessages =
  | StartMessage
  | StopMessage
  | SpeechMessage
  | SourceMessage;

type TranscriberState = {
  transcribing: boolean;
  transcriber?: audiosdk.SpeechRecognizer;
  config: ReturnType<typeof audiosdk.SpeechConfig.fromSubscription>;
};

const config: TranscriberState["config"] =
  audiosdk.SpeechConfig.fromSubscription(
    import.meta.env.PUBLIC_SPEECH_KEY,
    import.meta.env.PUBLIC_SPEECH_REGION
  );

const state: TranscriberState = {
  config,
  transcribing: false,
  // transcriber: new audiosdk.SpeechRecognizer(config, audio),
};

config.speechRecognitionLanguage = "en-US";

function handleRecognizedText(e: audiosdk.SpeechRecognitionEventArgs) {
  console.log({
    type: "speech",
    transcription: {
      text: e.result.text,
      time: new Date(),
    },
  });
  postMessage({
    type: "speech",
    transcription: {
      text: e.result.text,
      time: new Date(),
    },
  } as SpeechMessage);
}

self.onmessage = function (e) {
  const message = e.data as TranscriberMessages;

  if (message.type === "source") {
    state.transcriber = new audiosdk.SpeechRecognizer(
      state.config,
      message.audio
    );
    state.transcriber.recognized = (_, e) => handleRecognizedText(e);
  } else if (message.type === "start") {
    if (!state.transcribing)
      state.transcriber?.startContinuousRecognitionAsync();
    postMessage({
      type: "start",
    } as StartMessage);
  } else if (message.type === "stop") {
    state.transcriber?.stopContinuousRecognitionAsync();
    postMessage({
      type: "stop",
    } as StopMessage);
  }
};
