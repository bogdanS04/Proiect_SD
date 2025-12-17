# build
FROM maven:3.9-amazoncorretto-21 AS build
WORKDIR /device-service
COPY pom.xml .
RUN mvn -B -e -DskipTests dependency:go-offline
COPY src ./src
RUN mvn -B -e clean package -DskipTests
# la începutul stage-ului de build sau runtime
ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
ENV CATALINA_OPTS="-Duser.timezone=UTC"

# runtime
FROM amazoncorretto:21-alpine
WORKDIR /app
COPY --from=build /device-service/target/device-service-0.0.1-SNAPSHOT.jar /app/device-service.jar
EXPOSE 8082
CMD ["java","-jar","device-service.jar"]
