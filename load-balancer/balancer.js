import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672/';
const DATA_EXCHANGE = process.env.DATA_EXCHANGE || 'ems.data';
const RAW_QUEUE = process.env.RAW_QUEUE || 'lb.raw';
const INGEST_PREFIX = process.env.INGEST_PREFIX || 'monitoring.ingest.';
const REPLICA_COUNT = Number(process.env.REPLICA_COUNT || 2);

let channel;
let targets = [];
let counter = 0; 

function log(...args) {
  console.log('[lb]', ...args);
}

function pickQueue(msg) {
  if (!targets.length) return null;
  const deviceId = extractDeviceId(msg);
  if (deviceId && deviceId !== 'unknown') {
   
    const h = [...String(deviceId)].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 0);
    const idx = h % targets.length;
    return targets[idx];
  }
  
  const idx = counter % targets.length;
  counter += 1;
  return targets[idx];
}

function extractDeviceId(msg) {
  try {
    const payload = JSON.parse(msg.content.toString('utf-8'));
    return payload.device_id || payload.deviceId || 'unknown';
  } catch {
    return 'unknown';
  }
}

async function start() {
  const conn = await amqp.connect(RABBITMQ_URL);
  channel = await conn.createChannel();

  await channel.assertExchange(DATA_EXCHANGE, 'topic', { durable: true });
  await channel.assertQueue(RAW_QUEUE, { durable: true });
  await channel.bindQueue(RAW_QUEUE, DATA_EXCHANGE, 'device.*.reading');

  targets = Array.from({ length: Math.max(1, REPLICA_COUNT) }, (_, i) => `${INGEST_PREFIX}${i + 1}`);
  for (const q of targets) {
    await channel.assertQueue(q, { durable: true });
  }

  log(`listening on queue "${RAW_QUEUE}" and distributing to: ${targets.join(', ')}`);

  channel.consume(
    RAW_QUEUE,
    (msg) => {
      if (!msg) return;
      const target = pickQueue(msg);
      if (!target) {
        log('no targets available, requeue message');
        channel.nack(msg, false, true);
        return;
      }
      channel.sendToQueue(target, msg.content, {
        persistent: true,
        contentType: msg.properties.contentType || 'application/json',
        headers: msg.properties.headers
      });
      const deviceId = extractDeviceId(msg);
      log(`sent reading of device ${deviceId} -> ${target}`);
      channel.ack(msg);
    },
    { noAck: false }
  );
}

async function main() {
  let attempt = 0;
  while (true) {
    try {
      attempt += 1;
      log(`connecting to RabbitMQ (attempt ${attempt}) ...`);
      await start();
      break;
    } catch (err) {
      log(`connect failed: ${err.message || err}. retrying in 3s`);
      await new Promise((res) => setTimeout(res, 3000));
    }
  }
}

main().catch((err) => {
  console.error('[lb] fatal', err);
  process.exit(1);
});
