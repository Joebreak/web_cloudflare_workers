export interface Env {
  HELLO_MESSAGE: string;
  CHAT_ROOM: DurableObjectNamespace;
  // 之後如果要練習 KV，可以加：
  // MY_KV: KVNamespace;
}

class ChatRoom implements DurableObject {
  private sessions: WebSocket[] = [];

  constructor(private state: DurableObjectState, private env: Env) {}

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];

    this.sessions.push(server);
    server.accept();

    server.addEventListener("message", (event) => {
      const data = String(event.data ?? "");

      const payload = JSON.stringify({
        type: "message",
        body: data,
        // 這裡簡單塞 timestamp，實際上你可以加 userId / room 等資訊
        ts: Date.now(),
      });

      for (const ws of this.sessions) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(payload);
        }
      }
    });

    server.addEventListener("close", () => {
      this.sessions = this.sessions.filter((ws) => ws !== server);
    });

    server.addEventListener("error", () => {
      this.sessions = this.sessions.filter((ws) => ws !== server);
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    } as unknown as ResponseInit);
  }
}

const router = async (request: Request, env: Env): Promise<Response> => {
  const url = new URL(request.url);
  const { pathname, searchParams } = url;

  if (pathname === "/") {
    return new Response(
      JSON.stringify(
        {
          ok: true,
          message: env.HELLO_MESSAGE,
          hint:
            "WebSocket endpoint 在 /ws?room=default，用 wss://.../ws 連線，query string room 可換房間",
        },
        null,
        2
      ),
      {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
        },
      }
    );
  }

  if (pathname === "/ws") {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    const roomName = searchParams.get("room") ?? "default";

    const id = env.CHAT_ROOM.idFromName(roomName);
    const stub = env.CHAT_ROOM.get(id);

    // 把 upgrade request 丟進對應 room 的 Durable Object
    return stub.fetch(request);
  }

  return new Response(
    JSON.stringify(
      {
        ok: false,
        error: "Not found",
        path: pathname,
      },
      null,
      2
    ),
    {
      status: 404,
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
    }
  );
};

const worker: ExportedHandler<Env> = {
  async fetch(request, env, ctx) {
    return router(request, env);
  },
};

export default worker;

export { ChatRoom };

