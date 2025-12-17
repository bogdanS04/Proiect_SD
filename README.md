„Energy Management System”

„Distributed Event-Driven Microservices Platform”
„Assignment 3 – WebSockets, Chat, Load Balancing”

---

## „Overview”

Acest proiect implementează o „platformă distribuită de management energetic”, construită folosind o „arhitectură de microservicii orientată pe evenimente (event-driven)”.

Sistemul simulează date de consum energetic, le procesează asincron folosind un „message broker”, agregă consumul orar și livrează „notificări în timp real” și „mesaje de chat” prin „WebSocket”.

Arhitectura respectă principii cloud-native:

* „each service owns its database”
* „communication is asynchronous where possible”
* „single API Gateway (Traefik)”
* „JWT-based security”
* „scalable consumers with load balancing”

---

## „Architecture Summary”

### „Core Components”

* „Traefik” – „Reverse Proxy / API Gateway”
* „RabbitMQ” – „Message Broker (topic exchanges)”
* „PostgreSQL” – „Database per microservice”
* „Spring Boot” – „Core backend services”
* „Node.js” – „WebSocket service + load balancer”
* „React SPA” – „Frontend”

---

## „Services”

### „auth-service”

* gestionează „login” și „register”
* emite „JWT tokens”
* expune endpoint intern „/internal/verify” pentru „Traefik ForwardAuth”
* baza de date: „authdb”

---

### „user-service”

* gestionează „user profiles” și „roles”
* operațiile CRUD sunt permise doar pentru „ROLE_ADMIN”
* publică evenimente:

  * „user.created”
  * „user.deleted”
* baza de date: „userdb”

---

### „device-service”

* CRUD pentru „devices”
* ștergere în cascadă („cascade delete”) la ștergerea unui utilizator
* menține tabel de utilizatori sincronizați
* publică:

  * „device.created”
* consumă:

  * „user.created”
  * „user.deleted”
* baza de date: „devicedb”

---

### „monitoring-service”

* consumă evenimente de măsurare din „RabbitMQ”
* agregă consumul „kWh / oră (UTC)”
* detectează „overconsumption”
* publică notificări către „ems.ws”

Endpoint REST:

* „GET /api/consumption/day”

Baza de date: „monitoringdb”

---

### „monitoring-worker-2”

* al doilea consumator al fluxului de ingest
* procesează datele în paralel
* partajează baza de date „monitoringdb”

---

## „Messaging & Realtime”

### „simulator”

* producer Python
* publică periodic mesaje de forma „device.<id>.reading”
* exchange utilizat: „ems.data”

---

### „load-balancer”

* consumă o singură coadă brută din „ems.data”
* redistribuie mesajele „round-robin” către:

  * „monitoring.ingest.1”
  * „monitoring.ingest.2”

---

### „ws-service”

* gateway „WebSocket”
* autentificare prin „JWT”
* endpoint: „/ws?token=<JWT>”
* distribuie evenimente în timp real către clienți

---

### „support-service”

* chatbot „rule-based” (10 reguli)
* fallback AI opțional („OpenAI”)

Endpoint-uri REST:

* „/api/support/messages”
* „/api/support/admin/reply”
* „/api/support/history”

Publică evenimente:

* „chat.message” în „ems.ws”

---

## „Message Broker (RabbitMQ)”

Exchange-uri:

* „ems.data” – „device readings”
* „ems.sync” – „user/device synchronization”
* „ems.ws” – „chat & notifications”

---

## „WebSocket & Notifications”

Endpoint WebSocket:
„ws://app.localhost/ws?token=<JWT>”

Token invalid sau expirat ⇒ „forced disconnect + logout”

---

## „Overconsumption Logic”

Prag configurabil:
„APP_OVER_LIMIT_KWH = 0.5”

Notificarea este declanșată când:

* o măsurare individuală depășește pragul
* consumul agregat pe oră depășește pragul

---

## „REST API Routing”

Tot traficul trece prin „Traefik”.

Regulă importantă pentru a evita ca SPA-ul să intercepteze request-urile API:

„Host(`app.localhost`) && !PathPrefix(`\/api`)”

---

## „Why This Architecture”

Această arhitectură oferă:

* „loose coupling”
* „horizontal scalability”
* „fault tolerance”
* „real-time user experience”

Este un pattern identic cu cel utilizat în sisteme moderne de tip cloud.

---

## „Conclusion”

Proiectul demonstrează utilizarea corectă a:

* microserviciilor
* mesajelor asincrone
* WebSocket
* load balancing
* securității bazate pe „JWT”

---

„This project was developed as a Distributed Systems laboratory assignment for an Energy Management Platform.”
