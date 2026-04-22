FROM eclipse-temurin

WORKDIR /app

RUN apt-get update && apt-get install -y wget && \
    wget https://repo1.maven.org/maven2/com/mysql/mysql-connector-j/8.2.0/mysql-connector-j-8.2.0.jar && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

COPY App.java .

RUN javac -cp "mysql-connector-j-8.2.0.jar" App.java

CMD ["java", "-cp", ".:mysql-connector-j-8.2.0.jar", "App"]