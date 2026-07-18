# Huong dan deploy GitHub + Vercel

Du an nay la monorepo gom:

- `PTHTW_FrontEnd`: React + Vite SPA.
- `PTHTW_BackEnd`: Spring Boot + MySQL + Flyway.
- `database`: cau hinh MySQL local va seed demo day du.

## Trang thai deploy hien tai

Repo da co `vercel.json` o thu muc goc de chay 2 service tren cung mot domain Vercel:

- `/` -> frontend container.
- `/api/...` -> backend Spring Boot container.

Frontend mac dinh goi API cung domain qua cac endpoint `/api/v1/...`, nen khi deploy bang file root `vercel.json` thi khong can dat `VITE_API_BASE_URL`.

## 1. Chuan bi MySQL cloud

Tao mot MySQL database rong tren Railway, Aiven, PlanetScale, TiDB Cloud, Render, hoac nha cung cap MySQL bat ky.

Khong can import schema thu cong. Backend se tu chay Flyway migrations `V1` den `V15` khi start lan dau.

Neu muon co du lieu demo day du cho local, dung `database/init/seed_data.sql`. Khong nen import file nay vao production public neu chua muon public toan bo du lieu mau.

## 2. Bien moi truong can dat tren Vercel

Vao Vercel Project -> Settings -> Environment Variables, them cac key sau cho Production:

```env
SPRING_PROFILES_ACTIVE=prod
SPRING_DATASOURCE_URL=jdbc:mysql://<HOST>:<PORT>/<DATABASE>?useSSL=true&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true
SPRING_DATASOURCE_USERNAME=<MYSQL_USERNAME>
SPRING_DATASOURCE_PASSWORD=<MYSQL_PASSWORD>
JWT_SECRET=<BASE64_64_BYTE_SECRET>
CORS_ALLOWED_ORIGINS=https://<your-vercel-domain>.vercel.app
```

Email la tuy chon. Neu muon chuc nang gui email that, them:

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=<SMTP_EMAIL>
MAIL_PASSWORD=<SMTP_APP_PASSWORD>
MAIL_FROM=<SMTP_EMAIL>
```

Tao `JWT_SECRET` bang:

```bash
openssl rand -base64 64
```

## 3. Import len Vercel

1. Day source len GitHub.
2. Vao Vercel -> Add New -> Project -> Import Git Repository.
3. Chon repo nay.
4. Root Directory: de mac dinh la thu muc goc repo.
5. Deploy.

Vercel se doc `vercel.json` o thu muc goc va build 2 container:

- `PTHTW_FrontEnd/Dockerfile.vercel`
- `PTHTW_BackEnd/Dockerfile.vercel`

## 4. Tai khoan dang nhap demo

Flyway seed tao cac tai khoan co mat khau mac dinh:

```text
password123
```

Mot so email co san:

```text
admin@university.edu.vn
manager.qlkh@university.edu.vn
dean.fit@university.edu.vn
researcher.fit1@university.edu.vn
expert.council1@university.edu.vn
```

Nen doi mat khau seed neu dung production that.

## 5. Local development

Frontend:

```bash
cd PTHTW_FrontEnd
npm ci
npm run dev
```

Backend can MySQL va cac env:

```env
DB_PASSWORD=<local_mysql_password>
JWT_SECRET=<BASE64_64_BYTE_SECRET>
MAIL_PASSWORD=
```

Sau do chay:

```bash
cd PTHTW_BackEnd
./mvnw spring-boot:run
```

Tren Windows PowerShell, neu Maven wrapper `.cmd` loi, co the dung Git Bash hoac Docker build.

## 6. Ghi chu quan trong

- File upload moi da duoc luu vao MySQL (`topic_attachments.file_content`), phu hop voi container/stateless hosting.
- Frontend khong con dung `pdfjs-dist`; preview PDF dung viewer native cua trinh duyet.
- Neu deploy frontend rieng, dat `VITE_API_BASE_URL=https://<backend-domain>`.
- Neu deploy backend rieng, dat `CORS_ALLOWED_ORIGINS` bang domain frontend Vercel.
