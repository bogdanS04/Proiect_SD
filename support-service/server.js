import express from 'express';
import amqp from 'amqplib';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const PORT = Number(process.env.PORT || 8088);
const JWT_SECRET = process.env.JWT_SECRET || '';
let signingKey = JWT_SECRET;
try {
  if (JWT_SECRET && /^[A-Za-z0-9+/=]+$/.test(JWT_SECRET)) {
    signingKey = Buffer.from(JWT_SECRET, 'base64');
  }
} catch {
  signingKey = JWT_SECRET;
}
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672/';
const WS_EXCHANGE = process.env.WS_EXCHANGE || 'ems.ws';
const AI_MODEL = process.env.AI_MODEL || 'gpt-3.5-turbo';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const app = express();
app.use(express.json());

// in-memory chat history per userId
const conversations = new Map(); // userId -> [{id,sender,text,timestamp,source}]
let channel;

const RULES = [
  { keywords: ['salut', 'buna', 'hello', 'hi'], response: 'Salut! Cu ce te pot ajuta legat de platforma de management al energiei?' },
  { keywords: ['parola', 'reset', 'password'], response: 'Poți reseta parola din pagina de login. Dacă întâmpini probleme, scrie-mi username-ul și te ajut.' },
  { keywords: ['factura', 'billing', 'plata', 'cost'], response: 'Costurile estimate sunt în zona de consum. Pentru facturare oficială contactează administratorul.' },
  { keywords: ['consum', 'kwh', 'grafic'], response: 'Graficul zilnic se găsește în cardul "Consum zilnic". Selectează device-ul și data dorită.' },
  { keywords: ['device', 'dispozitiv', 'adauga', 'add'], response: 'Poți adăuga dispozitive din secțiunea "My Devices" sau dacă ești admin, din "Admin Devices".' },
  { keywords: ['admin', 'operator', 'consultant'], response: 'Un administrator primește mesajul tău și va intra în conversație în scurt timp.' },
  { keywords: ['alerta', 'alert', 'notificare'], response: 'Platforma trimite notificări în timp real pentru supraconsum prin WebSocket.' },
  { keywords: ['program', 'orar', 'support'], response: 'Suportul live răspunde în timpul orelor de laborator. Lasă mesaj și primești răspuns pe email/app.' },
  { keywords: ['date', 'gdpr', 'privacy'], response: 'Datele tale sunt stocate în baze separate per microserviciu și accesate doar cu JWT valid.' },
  { keywords: ['websocket', 'real-time', 'chat'], response: 'Canalul de chat folosește WebSocket + RabbitMQ pentru mesaje bidirecționale.' },
];

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).send('missing bearer token');
  }
  try {
    const token = header.slice('Bearer '.length);
    const claims = jwt.verify(token, signingKey);
    req.user = {
      id: String(claims.sub || ''),
      username: claims.username || '',
      role: (claims.role || claims.authorities?.[0]?.replace('ROLE_', '') || 'CLIENT').toUpperCase()
    };
    if (!req.user.id) throw new Error('missing sub');
    next();
  } catch (err) {
    res.status(401).send('invalid token');
  }
}

function appendMessage(userId, message) {
  const history = conversations.get(userId) || [];
  const enriched = { id: uuidv4(), timestamp: new Date().toISOString(), ...message };
  history.push(enriched);
  conversations.set(userId, history.slice(-50)); // keep last 50 per user
  return enriched;
}

function matchRule(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.response;
    }
  }
  return null;
}

async function aiReply(prompt) {
  if (!OPENAI_API_KEY) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: 'Ești un asistent prietenos pentru platforma de management al energiei. Răspunde concis în română.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 120
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.warn('[support] AI reply failed', err.message);
    return null;
  }
}

async function publishChat(userId, payload, audience = ['user', 'admin']) {
  const event = {
    type: 'chat',
    targetUserId: userId,
    audience,
    payload
  };
  await channel.publish(WS_EXCHANGE, 'chat.message', Buffer.from(JSON.stringify(event)), {
    contentType: 'application/json',
    persistent: true
  });
}

app.get('/health', (_req, res) => res.send('ok'));

app.get('/api/support/history', authMiddleware, (req, res) => {
  const requestedUser = req.user.role === 'ADMIN' && req.query.userId ? String(req.query.userId) : req.user.id;
  const history = conversations.get(requestedUser) || [];
  res.json(history);
});

app.post('/api/support/messages', authMiddleware, async (req, res) => {
  const text = (req.body?.text || '').trim();
  if (!text) return res.status(400).send('text is required');

  const userId = req.user.id;
  const userMsg = appendMessage(userId, { sender: 'user', source: 'user', text });
  await publishChat(userId, userMsg, ['user', 'admin']);

  let replyText = matchRule(text);
  let source = 'rule';
  if (!replyText) {
    const ai = await aiReply(text);
    if (ai) {
      replyText = ai;
      source = 'ai';
    }
  }
  if (!replyText) {
    replyText = 'Am trimis mesajul către administrator. Vei primi un răspuns în curând.';
    source = 'forward';
  }

  const botMsg = appendMessage(userId, { sender: source === 'ai' ? 'ai' : 'bot', source, text: replyText });
  await publishChat(userId, botMsg, ['user', 'admin']);

  res.json({ message: userMsg, reply: botMsg });
});

app.post('/api/support/admin/reply', authMiddleware, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).send('forbidden');
  const userId = String(req.body?.userId || '');
  const text = (req.body?.text || '').trim();
  if (!userId || !text) return res.status(400).send('userId and text are required');

  const adminMsg = appendMessage(userId, { sender: 'admin', source: 'admin', text });
  await publishChat(userId, adminMsg, ['user', 'admin']);
  res.json(adminMsg);
});

async function start() {
  // retry loop pentru RabbitMQ
  let attempt = 0;
  while (true) {
    try {
      attempt += 1;
      console.log(`[support] connecting to RabbitMQ (attempt ${attempt}) ...`);
      const conn = await amqp.connect(RABBITMQ_URL);
      channel = await conn.createChannel();
      await channel.assertExchange(WS_EXCHANGE, 'topic', { durable: true });
      break;
    } catch (err) {
      console.error('[support] RabbitMQ connect failed:', err.message || err);
      await new Promise((res) => setTimeout(res, 3000));
    }
  }

  app.listen(PORT, () => console.log(`[support] listening on :${PORT}`));
}

start().catch((err) => {
  console.error('[support] fatal', err);
  process.exit(1);
});
