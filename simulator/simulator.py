import json, time, random, os
from datetime import datetime, timezone
import pika

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
EXCHANGE = os.getenv("EXCHANGE", "ems.data")
DEVICE_ID = os.getenv("DEVICE_ID", "d-1")
INTERVAL_SECONDS = int(os.getenv("INTERVAL_SECONDS", "600"))  # 10 minute
BASE_LOAD = float(os.getenv("BASE_LOAD_KWH", "0.20"))
JITTER = float(os.getenv("JITTER", "0.05"))

params = pika.URLParameters(RABBITMQ_URL)

# simple retry loop to wait for broker
for attempt in range(30):
    try:
        conn = pika.BlockingConnection(params)
        break
    except Exception as e:
        print(f"[sim] waiting for rabbitmq... ({attempt+1}/30) {e}")
        time.sleep(2)
else:
    raise SystemExit("could not connect to RabbitMQ")

ch = conn.channel()
ch.exchange_declare(exchange=EXCHANGE, exchange_type='topic', durable=True)

rk = f"device.{DEVICE_ID}.reading"
print(f"[sim] publishing to exchange={EXCHANGE} rk={rk}")

def gen_value(now):
    h = now.hour
    base = BASE_LOAD
    if 0 <= h < 6:
        base *= 0.6
    elif 18 <= h < 23:
        base *= 1.6
    val = max(0.01, random.gauss(base, JITTER))
    return round(val, 4)

while True:
    now = datetime.now(timezone.utc)
    payload = {
        "timestamp": now.isoformat(),
        "device_id": DEVICE_ID,
        "measurement_value": gen_value(now)
    }
    ch.basic_publish(exchange=EXCHANGE, routing_key=rk,
                     body=json.dumps(payload).encode("utf-8"),
                     properties=pika.BasicProperties(delivery_mode=2))
    print("[sim] sent", payload)
    time.sleep(INTERVAL_SECONDS)
