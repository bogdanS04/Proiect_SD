# ---------- STAGE 1: Build ----------
FROM maven:3.9-eclipse-temurin-21 AS build

# la începutul stage-ului de build sau runtime
ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
ENV CATALINA_OPTS="-Duser.timezone=UTC"

WORKDIR /user-service
COPY ./pom.xml ./
RUN mvn -q -e -DskipTests dependency:go-offline

COPY ./src ./src
RUN mvn -q -e clean package -DskipTests

# ---------- STAGE 2: Runtime ----------
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /user-service/target/user-service-0.0.1-SNAPSHOT.jar /app/user-service.jar
EXPOSE 8081
CMD ["java", "-jar", "user-service.jar"]
