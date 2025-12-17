-- Ensure deleting a user deletes its devices, readings, and hourly rows
ALTER TABLE readings
    DROP CONSTRAINT IF EXISTS readings_device_id_fkey;

ALTER TABLE hourly_consumption
    DROP CONSTRAINT IF EXISTS hourly_consumption_device_id_fkey;

ALTER TABLE devices
    DROP CONSTRAINT IF EXISTS devices_user_id_fkey;

ALTER TABLE devices
    ADD CONSTRAINT devices_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE readings
    ADD CONSTRAINT readings_device_id_fkey
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE;

ALTER TABLE hourly_consumption
    ADD CONSTRAINT hourly_consumption_device_id_fkey
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE;
