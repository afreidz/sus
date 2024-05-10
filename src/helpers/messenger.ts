import {
  Features,
  type Call,
  type DataChannelSender,
  type DataChannelReceiver,
} from "@azure/communication-calling";

import EventEmitter from "@/helpers/event";
import { type Transcription } from "@/helpers/transcribe";

type PingTestMessage = {
  type: "ping";
};

type PushURLMessage = {
  type: "push-url";
  url: string;
};

type SessionStartMessage = {
  type: "session-start";
};

type SessionStopMessage = {
  type: "session-stop";
};

type RecordingStartMessage = {
  type: "recording-start";
};

type RecordingStopMessage = {
  type: "recording-stop";
};

type TranscriptionMessage = {
  type: "transcription";
  transcription: Transcription;
};

export type DataMessage =
  | PingTestMessage
  | PushURLMessage
  | SessionStartMessage
  | SessionStopMessage
  | RecordingStartMessage
  | RecordingStopMessage
  | TranscriptionMessage;

export default class Messenger extends EventEmitter {
  private _ready: boolean;
  private _decoder: TextDecoder;
  private _encoder: TextEncoder;
  private _sender: DataChannelSender;
  private _receiver?: DataChannelReceiver;

  constructor(call: Call) {
    super();
    this._ready = false;

    const channel = call.feature(Features.DataChannel);

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    this._encoder = encoder;
    this._decoder = decoder;

    channel.on("dataChannelReceiverCreated", (receiver) => {
      this._receiver = receiver;
      this._ready = true;
      this.emit("ready");
      receiver.on("messageReady", () => this._handleMessage());
      console.log("Data channel receiver intitialized");
      this.send({ type: "ping" });
    });

    this._sender = channel.createDataChannelSender({ channelId: 1000 });
  }

  private _handleMessage() {
    const message = this._receiver?.readMessage();
    if (this._receiver?.channelId !== 1000 || !message) return;

    this.emit(
      "message",
      JSON.parse(this._decoder.decode(message?.data)) as DataMessage
    );
    console.log(
      "Received data message",
      JSON.parse(this._decoder.decode(message?.data)) as DataMessage
    );
  }

  get ready() {
    return this._ready;
  }

  send(d: DataMessage) {
    console.log("Sending data message", d);
    this._sender.sendMessage(this._encoder.encode(JSON.stringify(d)));
  }
}
