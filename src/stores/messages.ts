import { atom } from "nanostores";
const messages = atom<ApplicationMessage[]>([]);

export type ApplicationMessage = {
  type: "error" | "success" | "info";
  message: string;
  detail?: string;
  timer?: ReturnType<typeof setTimeout>;
};

export function MessageHandler(msg: ApplicationMessage) {
  const appMsgs = messages.get();
  const newMsgs = [...appMsgs, msg];
  msg.timer = setTimeout(() => DismissMessage(msg), 10000);
  messages.set(newMsgs);
}

export function DismissMessage(m: number | ApplicationMessage) {
  const appMsgs = messages.get();
  const idx = typeof m === "number"
    ? m
    : appMsgs.indexOf(m);

    const newMsgs = [...appMsgs];
    newMsgs.splice(idx, 1);
    messages.set(newMsgs);
}

export default messages;
