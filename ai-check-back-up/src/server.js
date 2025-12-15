import Fastify from "fastify";
import axios from "axios";
import https from "https";
import fs from "fs";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = Fastify({ logger: false });

let gigaAgent;

async function initCertAgent() {
  try {
    console.log("Downloading Russian Trusted CA certificates...");
    
    const tempAgent = new https.Agent({ rejectUnauthorized: false });

    async function downloadCert(url, filename) {
      const resp = await axios.get(url, { 
        timeout: 15000, 
        httpsAgent: tempAgent,
        responseType: 'text'
      });
      const text = resp.data;
      const filePath = join(__dirname, filename);
      fs.writeFileSync(filePath, text);
      return text;
    }

    const rootPem = await downloadCert(
      "https://gu-st.ru/content/lending/russian_trusted_root_ca_pem.crt",
      "russian_trusted_root_ca_pem.crt"
    );
    
    const subPem = await downloadCert(
      "https://gu-st.ru/content/lending/russian_trusted_sub_ca_pem.crt",
      "russian_trusted_sub_ca_pem.crt"
    );

    const caBundlePath = join(__dirname, 'russian_ca_bundle.pem');
    fs.writeFileSync(caBundlePath, `${rootPem}\n${subPem}`);
    process.env.NODE_EXTRA_CA_CERTS = caBundlePath;

    // Create agent with custom socket timeout handling
    gigaAgent = new https.Agent({
      ca: [rootPem, subPem],
      keepAlive: true,
      rejectUnauthorized: true,
      maxSockets: 10,
      keepAliveMsecs: 5000,  // Send keepalive every 5 seconds (more aggressive)
      timeout: 0,  // No connection timeout
      freeSocketTimeout: 0,  // Don't close idle sockets
    });
    
    // Set socket timeout to 10 minutes (600000ms) for all sockets created by this agent
    // Node.js default socket timeout is 2 minutes, but we need longer for GigaChat
    gigaAgent.on('socket', (socket) => {
      console.log(`[Socket] New socket created, setting timeout to 10 minutes`);
      socket.setTimeout(600000);  // 10 minutes in milliseconds
      // More aggressive keepalive: send keepalive packets every 5 seconds to prevent 60s idle timeout
      socket.setKeepAlive(true, 5000);  // Enable keep-alive with 5 second initial delay, then every 5 seconds
      
      // Add detailed socket event logging
      socket.on('timeout', () => {
        console.error(`[Socket] Socket timeout event fired after ${socket.timeout}ms`);
      });
      
      socket.on('close', (hadError) => {
        console.log(`[Socket] Socket closed, hadError: ${hadError}`);
      });
      
      socket.on('error', (err) => {
        console.error(`[Socket] Socket error:`, err.message);
      });
      
      socket.on('end', () => {
        console.log(`[Socket] Socket ended by remote`);
      });
      
      // Log socket state
      console.log(`[Socket] Socket timeout: ${socket.timeout}, keepAlive: ${socket.keepAlive}, keepAliveInitialDelay: ${socket.keepAliveInitialDelay}`);
    });
    console.log("GigaChat CA certificates installed successfully.");
  } catch (e) {
    console.error(`CA fetch error: ${e.message}`);
    throw e;
  }
}

app.addHook("onRequest", async (req, reply) => {
  const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",").map(s => s.trim()).filter(Boolean);
  const origin = req.headers.origin || "";
  if (origin && allowedOrigins.length && !allowedOrigins.includes(origin)) {
    reply.header("Access-Control-Allow-Origin", "null");
  } else if (origin) {
    reply.header("Access-Control-Allow-Origin", origin);
  }
  reply.header("Vary", "Origin");
  reply.header("Access-Control-Allow-Headers", "content-type, x-api-key");
  reply.header("Access-Control-Allow-Methods", "POST, OPTIONS");
});

app.options("/gigacheck", async (_req, reply) => reply.code(204).send());

let tokenCache = null;
async function getGigaToken() {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.exp - 60 > now) {
    console.log("Using cached OAuth token");
    return tokenCache.token;
  }

  const auth = process.env.GIGACHAT_CLIENT_SECRET;
  const rqUID = randomUUID();
  
  console.log("Requesting GigaChat OAuth token...");
  const res = await axios.post(
    "https://ngw.devices.sberbank.ru:9443/api/v2/oauth",
    new URLSearchParams({
      scope: process.env.GIGACHAT_SCOPE || "GIGACHAT_API_PERS"
    }).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "RqUID": rqUID,
        "Authorization": `Basic ${auth}`,
      },
      timeout: 30000,
      httpsAgent: gigaAgent
    }
  );
  
  const data = res.data;
  const exp = data.expires_at
    ? Math.floor(new Date(data.expires_at).getTime() / 1000)
    : Math.floor(Date.now() / 1000) + (data.expires_in ?? 1800);
  tokenCache = { token: data.access_token, exp };
  console.log("OAuth token obtained successfully");
  return tokenCache.token;
}

app.get("/external-test", async (_req, reply) => {
  const start = Date.now();
  try {
    console.log("Starting external delay test...");
    const testAgent = new https.Agent({ 
      keepAlive: false,
      rejectUnauthorized: false 
    });
    const res = await axios.get("https://httpbin.org/delay/65", {
      httpsAgent: testAgent,
      timeout: 70000,
    });
    const elapsed = Date.now() - start;
    console.log(`External test completed in ${elapsed}ms, status ${res.status}`);
    return reply.send({ elapsed, status: res.status });
  } catch (err) {
    const elapsed = Date.now() - start;
    console.error("External test error:", err.message, "after", elapsed, "ms");
    return reply.code(500).send({ error: err.message, elapsed });
  }
});

app.post("/gigacheck", async (req, reply) => {
  try {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey || apiKey !== process.env.AI_CHECK_BACKUP_API_KEY) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    const { postTitle, postContent, originalSourceUrls = [] } = req.body || {};
    if (!postTitle || !postContent) {
      return reply.code(400).send({ error: "postTitle and postContent are required" });
    }

    if (!gigaAgent) {
      throw new Error("Certificate agent not initialized");
    }

    console.log("Starting fact-check for:", postTitle);
    const token = await getGigaToken();

    // ULTRA-MINIMAL: Title only, no post content, no exclusion list
    const combinedPrompt = `Найди 2 URL по "${postTitle}". JSON: {"urls": ["url1", "url2"], "isValid": "да"}`;

    console.log("Calling GigaChat chat/completions (ultra-minimal combined)...");
    const startTime = Date.now();
    const requestId = randomUUID();
    const sessionId = randomUUID();
    console.log("X-Request-ID:", requestId);
    console.log("X-Session-ID:", sessionId);
    
    // Add periodic heartbeat logging
    const heartbeatInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      console.log(`[Heartbeat] Request still in progress, elapsed: ${elapsed}ms`);
    }, 10000); // Every 10 seconds
    
    let res;
    try {
      res = await axios.post(
      "https://gigachat.devices.sberbank.ru/api/v1/chat/completions",
      {
        model: process.env.GIGACHAT_MODEL || "GigaChat",
        stream: false,
        update_interval: 0,
        messages: [{ role: "user", content: combinedPrompt }],
        temperature: 0.0,
        max_tokens: 100,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Request-ID": requestId,
          "X-Session-ID": sessionId,
          "X-Client-ID": process.env.GIGACHAT_CLIENT_ID || "",
        },
        httpsAgent: gigaAgent,
        timeout: 600000,  // 10 minutes in milliseconds - axios needs a number, not 0
      }
      );
      
      clearInterval(heartbeatInterval);
      const elapsed = Date.now() - startTime;
      console.log(`Request completed successfully in ${elapsed}ms`);
      
    } catch (axiosError) {
      clearInterval(heartbeatInterval);
      const elapsed = Date.now() - startTime;
      
      // Detailed error logging
      if (axiosError.code === 'ECONNRESET' || axiosError.code === 'ETIMEDOUT') {
        console.error(`[Axios Error] Connection error after ${elapsed}ms:`, {
          code: axiosError.code,
          message: axiosError.message,
          response: axiosError.response?.status,
          responseData: axiosError.response?.data
        });
      } else {
        console.error(`[Axios Error] Request failed after ${elapsed}ms:`, {
          code: axiosError.code,
          message: axiosError.message,
          stack: axiosError.stack
        });
      }
      
      throw axiosError;
    }
    
    const json = res.data;
    const raw = json?.choices?.[0]?.message?.content || "{}";
    
    let urls = [];
    let isValid = true; // Default to true since we can't validate without post content
    
    try {
      const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw);
      urls = Array.isArray(parsed.urls) ? parsed.urls.slice(0, 2) : [];
      
      const validText = (parsed.isValid || "").toLowerCase();
      isValid = validText.includes("да") || validText.includes("верна") || validText.includes("подтверждается");
    } catch (e) {
      console.error("Failed to parse response:", e.message);
      // Try to extract URLs from raw text as fallback
      const urlMatches = raw.match(/https?:\/\/[^\s"']+/g);
      if (urlMatches) {
        urls = urlMatches.slice(0, 2);
      }
    }

    const norm = u => { try { const p = new URL(u); return p.hostname.replace(/^www\./,"")+p.pathname.replace(/\/$/,""); } catch { return (u||"").toLowerCase(); } };
    const known = new Set(originalSourceUrls.map(norm));
    const found = urls.filter(u => u && !known.has(norm(u))).slice(0, 2)
      .map((u, i) => ({ url: u, title: `Источник ${i+1}` }));

    if (found.length === 0) {
      return reply.send({ isValid: false, foundSources: [], noSourcesFound: true });
    }
    
    return reply.send({ 
      isValid,
      foundSources: found, 
      noSourcesFound: false 
    });
  } catch (e) {
    console.error("Error in /gigacheck:", e.message);
    return reply.code(500).send({ error: e.message || "Internal error", isValid: false, foundSources: [], noSourcesFound: true });
  }
});

await initCertAgent();
app.listen({ host: "0.0.0.0", port: Number(process.env.PORT) || 8080 });
