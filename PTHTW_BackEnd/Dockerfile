# Giai đoạn 1: Biên dịch mã nguồn với Maven
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app
# Tải phụ thuộc trước để tận dụng bộ nhớ đệm (Cache) của Docker
COPY pom.xml .
RUN mvn dependency:go-offline
# Sao chép mã nguồn và biên dịch, bỏ qua kiểm thử
COPY src ./src
RUN mvn clean package -DskipTests

# Giai đoạn 2: Môi trường Thực thi gọn nhẹ
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
# Chỉ sao chép tệp .jar từ giai đoạn builder
COPY --from=builder /app/target/*.jar app.jar
# Khai báo cổng nội bộ
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]