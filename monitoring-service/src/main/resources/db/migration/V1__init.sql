CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS devices (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS readings (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL REFERENCES devices(id),
    timestamp TIMESTAMPTZ NOT NULL,
    measurement_value NUMERIC(10,4) NOT NULL
);

CREATE TABLE IF NOT EXISTS hourly_consumption (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL REFERENCES devices(id),
    hour_start TIMESTAMPTZ NOT NULL,
    total_kwh NUMERIC(12,4) NOT NULL,
    CONSTRAINT uq_hourly_device UNIQUE (device_id, hour_start)
);

CREATE INDEX IF NOT EXISTS idx_hourly_consumption_device_hour
    ON hourly_consumption(device_id, hour_start);
