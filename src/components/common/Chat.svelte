<script lang="ts">
  import { atom } from "nanostores";
  import { type DataConnection, Peer } from "peerjs";
  import { MessageHandler } from "@/stores/messages";

  type ChatMessage = {
    type: "chat";
    name: string;
    text: string;
    time: Date;
  };

  let name: string;
  let host: string;
  let newMessage: string;
  let type: "host" | "participant";
  let session: Readonly<Peer> | null;
  let dataConnection: DataConnection;
  let messages = atom<ChatMessage[]>([]);

  $: if (session) initChat();

  function initChat() {
    if (!session) {
      MessageHandler({
        type: "error",
        message: "Unable to connect to session",
      });
      return;
    }

    if (type === "host") {
      session.on("connection", (con) => {
        con.on("open", () => {
          console.log("Data connection started for chat");
          con.on("data", (m) => handleChatMessage(m as ChatMessage));
          dataConnection = con;
        });
      });
    } else if (type === "participant") {
      if (!host)
        return MessageHandler({
          type: "error",
          message: "Unable to connect to host",
        });

      const con = session.connect(host);
      con.on("open", () => {
        console.log("Data connection started for chat");
        con.on("data", (m) => handleChatMessage(m as ChatMessage));
        dataConnection = con;
      });
    }
  }

  function handleChatMessage(msg: ChatMessage) {
    if (msg.type !== "chat") return;
    const existing = messages.get();
    messages.set([...existing, msg]);
    console.log(messages.get());
  }

  function sendMessage() {
    if (!dataConnection) {
      MessageHandler({
        type: "error",
        message: "Unable to connect to session",
      });
      return;
    }

    const msg: ChatMessage = {
      name,
      type: "chat",
      time: new Date(),
      text: newMessage,
    };

    handleChatMessage(msg);
    dataConnection.send(msg);
    newMessage = "";
  }

  export { session, type, name, host };
</script>

<div class="flex-1 flex flex-col">
  <div class="flex-1 overflow-auto">
    {#each $messages as message}
      <div
        class="chat"
        class:chat-start={message.name !== name}
        class:chat-end={message.name === name}
      >
        <div class="chat-header text-neutral opacity-30">
          {message.name}
        </div>
        <div
          class:chat-bubble-secondary={message.name === name}
          class="chat-bubble"
        >
          {message.text}
        </div>
      </div>
    {/each}
  </div>
  <form
    on:submit|preventDefault={sendMessage}
    class="flex items-center justify-center w-full gap-2 p-2"
  >
    <input
      type="text"
      placeholder="Type here"
      bind:value={newMessage}
      class="flex-1 input input-bordered"
    />
    <button type="submit" class="btn btn-primary flex-none">Send</button>
  </form>
</div>
