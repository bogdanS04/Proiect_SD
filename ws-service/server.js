import { WebSocketServer, WebSocket } from 'ws';
import amqp from 'amqplib';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const PORT = Number(process.env.PORT || 8087);
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672/';
const WS_EXCHANGE = process.env.WS_EXCHANGE || 'ems.ws';
const WS_QUEUE = process.env.WS_QUEUE || 'ws.events';
const JWT_SECRET = process.env.JWT_SECRET || '';

// decode Base64 secret if provided in that form (same as auth-service)
let signingKey = JWT_SECRET;
try {
  if (JWT_SECRET && /^[A-Za-z0-9+/=]+$/.test(JWT_SECRET)) {
    signingKey = Buffer.from(JWT_SECRET, 'base64');
  }
} catch {
  signingKey = JWT_SECRET;
}

if (!JWT_SECRET) {
  console.warn('[ws] JWT_SECRET not provided – connections will fail verification');
}

const clients = new Map(); // ws -> { id, userId, role, username, isAlive }
let channel;

function extractToken(req) {
  try {
    const url = new URL(req.url, 'http://localhost');
    const tokenFromQuery = url.searchParams.get('token');
    if (tokenFromQuery) return tokenFromQuery;
  } catch (e) {
    // ignore
  }
  const proto = req.headers['sec-websocket-protocol'];
  if (proto) return proto;
  const auth = req.headers['authorization'];
  if (auth && auth.startsWith('Bearer ')) return auth.slice('Bearer '.length);
  return null;
}

function verifyReq(req) {
  const token = extractToken(req);
  if (!token) throw new Error('missing token');
  const claims = jwt.verify(token, signingKey);
  return {
    userId: String(claims.sub || ''),
    username: claims.username || '',
    role: (claims.role || claims.authorities?.[0]?.replace('ROLE_', '') || 'CLIENT').toUpperCase()
  };
}

function send(ws, data) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function deliver(event) {
  const { targetUserId = null, audience = ['user'], type, payload, timestamp = new Date().toISOString() } = event;
  const audiences = Array.isArray(audience) ? audience : [audience];

  clients.forEach((info, sock) => {
    if (sock.readyState !== WebSocket.OPEN) return;

    const isTargetUser = targetUserId && info.userId === String(targetUserId);
    const isAdmin = info.role === 'ADMIN';
    const shouldSend =
      audiences.includes('all') ||
      (audiences.includes('user') && (isTargetUser || !targetUserId)) ||
      (audiences.includes('admin') && isAdmin);

    if (shouldSend) {
      send(sock, { type, targetUserId, audience: audiences, payload, timestamp });
    }
  });
}

async function startAmqp() {
  const conn = await amqp.connect(RABBITMQ_URL);
  channel = await conn.createChannel();
  await channel.assertExchange(WS_EXCHANGE, 'topic', { durable: true });
  await channel.assertQueue(WS_QUEUE, { durable: true });
  await channel.bindQueue(WS_QUEUE, WS_EXCHANGE, '#');

  await channel.consume(
    WS_QUEUE,
    (msg) => {
      if (!msg) return;
      try {
        const event = JSON.parse(msg.content.toString('utf-8'));
        deliver(event);
      } catch (err) {
        console.error('[ws] failed to process message', err);
      } finally {
        channel.ack(msg);
      }
    },
    { noAck: false }
  );

  console.log(`[ws] bound queue "${WS_QUEUE}" to exchange "${WS_EXCHANGE}"`);
}

function startHeartbeat(server) {
  setInterval(() => {
    server.clients.forEach((ws) => {
      const meta = clients.get(ws);
      if (!meta) return;
      if (!meta.isAlive) {
        console.warn(`[ws] terminating stale connection for user ${meta.userId}`);
        return ws.terminate();
      }
      meta.isAlive = false;
      ws.ping();
    });
  }, 30000);
}

async function start() {
  // retry loop for RabbitMQ
  let attempt = 0;
  while (true) {
    try {
      attempt += 1;
      console.log(`[ws] connecting to RabbitMQ (attempt ${attempt}) ...`);
      await startAmqp();
      break;
    } catch (err) {
      console.error('[ws] RabbitMQ connect failed:', err.message || err);
      await new Promise((res) => setTimeout(res, 3000));
    }
  }

  const wss = new WebSocketServer({ port: PORT, path: '/ws' });
  wss.on('connection', (ws, req) => {
    let user;
    try {
      user = verifyReq(req);
      if (!user.userId) throw new Error('invalid token payload');
    } catch (err) {
      console.warn('[ws] closing connection, auth failed:', err.message);
      ws.close(4401, 'unauthorized');
      return;
    }

    const meta = { id: uuidv4(), ...user, isAlive: true };
    clients.set(ws, meta);
    console.log(`[ws] client connected user=${meta.userId} role=${meta.role}`);
    send(ws, { type: 'welcome', userId: meta.userId, role: meta.role });

    ws.on('pong', () => {
      const m = clients.get(ws);
      if (m) m.isAlive = true;
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`[ws] client disconnected user=${meta.userId}`);
    });
  });

  startHeartbeat(wss);

  console.log(`[ws] listening on :${PORT} (ws path: /ws)`);
}

start().catch((err) => {
  console.error('[ws] fatal error', err);
  process.exit(1);
});
