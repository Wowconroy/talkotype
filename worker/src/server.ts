import { createServer } from "node:http";
import { config } from "./config.js";
import { claimQueuedJobs, processTranscript } from "./process-job.js";

const inflight = new Set<string>();

function authorized(req: { headers: { authorization?: string | string[] } }) {
  if (!config.sharedSecret) return true; // local/dev without secret
  const header = req.headers.authorization;
  const value = Array.isArray(header) ? header[0] : header;
  return value === `Bearer ${config.sharedSecret}`;
}

async function runJob(transcriptId: string) {
  if (inflight.has(transcriptId)) {
    return { ok: true, deduped: true };
  }
  inflight.add(transcriptId);
  try {
    return await processTranscript(transcriptId);
  } finally {
    inflight.delete(transcriptId);
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, service: "talkotype-worker" }));
      return;
    }

    if (req.method === "POST" && url.pathname.startsWith("/jobs/")) {
      if (!authorized(req)) {
        res.writeHead(401, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "unauthorized" }));
        return;
      }
      const transcriptId = url.pathname.slice("/jobs/".length).split("/")[0];
      if (!transcriptId) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "missing_transcript_id" }));
        return;
      }

      // Acknowledge quickly; process in background.
      res.writeHead(202, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, accepted: true, transcriptId }));

      void runJob(transcriptId).catch((err) => {
        console.error(
          "[worker] job failed",
          transcriptId,
          err instanceof Error ? err.message : err,
        );
      });
      return;
    }

    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "not_found" }));
  } catch (err) {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        error: err instanceof Error ? err.message : "server_error",
      }),
    );
  }
});

server.listen(config.port, () => {
  console.log(`[worker] listening on :${config.port}`);
});

// Backup poller if HTTP dispatch is missed.
setInterval(() => {
  void (async () => {
    try {
      const ids = await claimQueuedJobs(2);
      for (const id of ids) {
        if (inflight.has(id)) continue;
        void runJob(id).catch((err) => {
          console.error(
            "[worker] polled job failed",
            id,
            err instanceof Error ? err.message : err,
          );
        });
      }
    } catch (err) {
      console.error(
        "[worker] poll error",
        err instanceof Error ? err.message : err,
      );
    }
  })();
}, config.pollMs);
