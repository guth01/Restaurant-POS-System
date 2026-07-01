import os

services = [
    "auth-service",
    "menu-service",
    "notification-service",
    "order-service",
    "payment-service",
    "table-service"
]

dockerfile_content = """# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline || true
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
"""

dockerignore_content = """target/
!.mvn/wrapper/maven-wrapper.jar
!**/src/main/**/target/
!**/src/test/**/target/

### IntelliJ IDEA ###
.idea
*.iws
*.iml
*.ipr

### Eclipse ###
.apt_generated
.classpath
.factorypath
.project
.settings
.springBeans
.sts4-cache

### NetBeans ###
/nbproject/private/
/nbbuild/
/dist/
/nbdist/
/.nb-gradle/
build/
!**/src/main/**/build/
!**/src/test/**/build/
"""

base_dir = r"c:\Users\retailcloud\Desktop\restaurant"

for service in services:
    service_dir = os.path.join(base_dir, service)
    
    with open(os.path.join(service_dir, "Dockerfile"), "w") as f:
        f.write(dockerfile_content)
        
    with open(os.path.join(service_dir, ".dockerignore"), "w") as f:
        f.write(dockerignore_content)

print("Dockerfiles and .dockerignores generated successfully.")
