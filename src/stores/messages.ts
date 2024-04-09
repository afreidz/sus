import { atom } from "nanostores";
const messages = atom<ApplicationMessage[]>([]);

export type ApplicationMessage = {
  type: "error" | "success" | "info";
  message: string;
  detail?: string;
};

export function MessageHandler(msg: ApplicationMessage) {
  const appMsgs = messages.get();
  const newMsgs = [...appMsgs, msg];
  messages.set(newMsgs);
}

export function DismissMessage(idx: number) {
  const appMsgs = messages.get();
  const newMsgs = [...appMsgs];
  newMsgs.splice(idx, 1);
  messages.set(newMsgs);
}

export default messages;
