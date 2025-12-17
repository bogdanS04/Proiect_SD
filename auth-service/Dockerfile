# ---------- STAGE 1: Build ----------
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /auth-service

# Cache pentru deps
COPY ./pom.xml ./
RUN mvn -B -e -DskipTests dependency:go-offline

# Sursa
COPY ./src ./src

# la începutul stage-ului de build sau runtime
ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
ENV CATALINA_OPTS="-Duser.timezone=UTC"


# Build fără -q ca să vezi logul complet dacă pică
RUN mvn -B -e clean package -DskipTests

# ---------- STAGE 2: Runtime ----------
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /auth-service/target/auth-service-0.0.1-SNAPSHOT.jar /app/auth-service.jar
EXPOSE 8080
CMD ["java","-jar","auth-service.jar"]
