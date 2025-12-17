Energy Management System

Distributed Event-Driven Microservices Platform
Assignment 3 – WebSockets, Chat, Load Balancing

Overview

This project implements a distributed energy management platform built using an event-driven microservice architecture.
The system simulates energy consumption data, processes it asynchronously using a message broker, aggregates hourly usage, and delivers real-time notifications and chat messages via WebSockets.

The architecture follows cloud-native principles:

each service owns its database

communication is asynchronous where possible

a single API Gateway (Traefik)

JWT-based security

scalable consumers with load balancing

Architecture Summary
Core Components
Component	Description
Traefik	Reverse proxy / API Gateway
RabbitMQ	Message broker (topic exchanges)
PostgreSQL	Database per microservice
Spring Boot	Core backend services
Node.js	WebSocket + load balancer
React SPA	Frontend
Services
Authentication & Users
auth-service

Handles login & registration

Issues JWT tokens

Exposes /internal/verify for Traefik ForwardAuth

Database: authdb

user-service

User profiles and roles

Admin-only CRUD operations

Publishes:

user.created

user.deleted

Database: userdb

Devices & Monitoring
device-service

CRUD for devices

Cascading delete on user removal

Maintains synchronized users table

Publishes:

device.created

Consumes:

user.created

user.deleted

Database: devicedb

monitoring-service

Consumes measurement events from RabbitMQ

Aggregates hourly consumption (UTC)

Detects overconsumption

Publishes notifications to WebSocket exchange

REST API:

GET /api/consumption/day

Database: monitoringdb

monitoring-worker-2

Second consumer of the same ingest stream

Processes data in parallel

Shares monitoringdb

Messaging & Realtime
simulator

Python producer

Publishes periodic readings:

device.<id>.reading

Exchange: ems.data

load-balancer

Consumes a single raw queue from ems.data

Redistributes messages round-robin to:

monitoring.ingest.1

monitoring.ingest.2

ws-service

WebSocket gateway

Authenticates clients using JWT

Subscribes to ems.ws

Pushes events to connected clients in real time

support-service

Rule-based chatbot (10 rules)

Optional AI fallback (OpenAI)

REST endpoints:

/api/support/messages

/api/support/admin/reply

/api/support/history

Publishes chat messages to ems.ws

Message Broker (RabbitMQ)
Exchanges
Exchange	Type	Purpose
ems.data	topic	Device readings
ems.sync	topic	User/device synchronization
ems.ws	topic	Chat & notifications
Event Types

user.created

user.deleted

device.created

device.<id>.reading

notify.overconsumption

chat.message

WebSocket & Notifications

WebSocket endpoint:

ws://app.localhost/ws?token=<JWT>


Invalid or expired token ⇒ forced disconnect + logout

Real-time updates:

Chat messages

Overconsumption alerts

Overconsumption Logic

Configurable threshold:

APP_OVER_LIMIT_KWH=0.5


Triggered when:

Single measurement exceeds threshold

Hourly aggregated consumption exceeds threshold

Notification published to ems.ws

REST API Routing

All traffic goes through Traefik.

Path	Destination
/	Frontend SPA
/api/auth/*	auth-service
/api/users/*	user-service
/api/devices/*	device-service
/api/consumption/*	monitoring-service
/api/support/*	support-service
/ws	ws-service

⚠️ Important Traefik rule (to avoid SPA swallowing APIs):

Host(`app.localhost`) && !PathPrefix(`/api`)

Swagger UI
Service	URL
auth-service	http://app.localhost/api/auth/swagger-ui.html

user-service	http://app.localhost/api/users/swagger-ui.html

device-service	http://app.localhost/api/devices/swagger-ui.html

monitoring-service	http://app.localhost/api/consumption/swagger-ui.html
Frontend (React SPA)

Authenticated via JWT

Displays:

Daily consumption chart (24h)

Live overconsumption alerts

Support chat (user & admin)

Admin UI visible only if:

ROLE_ADMIN ∈ JWT authorities

Local Development
Domain
http://app.localhost

Start system
docker compose up --build


Wait until all services log:

Started ...

Fast simulator testing
INTERVAL_SECONDS=5 DEVICE_ID=7 docker compose up simulator

Usage Steps

Open http://app.localhost

Clear accessToken from browser LocalStorage

Register & login

Observe:

Live notifications

Chat messages

Consumption graphs

Data Consistency & Sync

Each service owns its DB

No shared schema

Data replication via events (ems.sync)

Deleting a user:

Deletes devices

Cascades monitoring records via FK

Why This Architecture

Loose coupling

Horizontal scalability

Fault tolerance

Real-time UX

Production-ready pattern

This design mirrors modern cloud microservice systems.

Assignment Checklist

Reverse proxy (Traefik) ✔️

Message broker (RabbitMQ) ✔️

Producer + consumers ✔️

Load balancing ✔️

WebSocket real-time delivery ✔️

Hourly aggregation ✔️

REST + Swagger ✔️

Deployment diagram ✔️

README ✔️

Quick Theory Answers (3.1)

Queue vs Topic

Queue: one consumer per message

Topic: broadcast to all subscribers

Point-to-Point vs Publish-Subscribe

P2P: work queues

Pub/Sub: event broadcast

Role of MOM

Decouples producers and consumers

Ensures reliable delivery

Enables asynchronous processing

Contact

This project was developed as a Distributed Systems laboratory assignment
for an Energy Management Platform.
