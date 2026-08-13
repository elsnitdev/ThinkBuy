# HƯỚNG DẪN LỆNH CMD
## React (Vite) + .NET Core trên VS Code

Tài liệu dùng như sổ tra cứu. Lệnh viết cho **Windows CMD / PowerShell**; phần khác biệt trên macOS/Linux được ghi chú riêng.

---

## MỤC LỤC

1. [Chuẩn bị môi trường](#1-chuẩn-bị-môi-trường)
2. [Extension VS Code](#2-extension-vs-code)
3. [Dựng Solution .NET](#3-dựng-solution-net)
4. [Quản lý Project và Reference](#4-quản-lý-project-và-reference)
5. [NuGet Package](#5-nuget-package)
6. [Entity Framework Core + MySQL](#6-entity-framework-core--mysql)
7. [Build, Run, Watch, Test](#7-build-run-watch-test)
8. [User Secrets và cấu hình](#8-user-secrets-và-cấu-hình)
9. [Dựng Frontend React + Vite](#9-dựng-frontend-react--vite)
10. [Lệnh npm hằng ngày](#10-lệnh-npm-hằng-ngày)
11. [Docker và Docker Compose](#11-docker-và-docker-compose)
12. [Ollama](#12-ollama)
13. [MySQL CLI](#13-mysql-cli)
14. [Git](#14-git)
15. [Cấu hình VS Code](#15-cấu-hình-vs-code)
16. [Xử lý sự cố thường gặp](#16-xử-lý-sự-cố-thường-gặp)
17. [Bảng tra nhanh](#17-bảng-tra-nhanh)

---

## 1. Chuẩn bị môi trường

### Kiểm tra công cụ đã cài

```cmd
dotnet --version
dotnet --list-sdks
node -v
npm -v
git --version
docker --version
```

> **Chọn phiên bản .NET:** nếu `dotnet --list-sdks` cho thấy bạn có .NET 10 (LTS) thì dùng nó — hỗ trợ dài hạn. Nếu chỉ có .NET 9 thì vẫn dùng bình thường, toàn bộ lệnh trong tài liệu này không đổi. Chỉ cần thống nhất một phiên bản cho cả solution qua file `global.json`.

### Cố định phiên bản SDK cho dự án

```cmd
cd D:\Projects\LaptopCommerce
dotnet new globaljson --sdk-version 9.0.100 --roll-forward latestFeature
```

### Cài công cụ toàn cục

```cmd
dotnet tool install --global dotnet-ef
dotnet tool install --global dotnet-outdated-tool
dotnet tool update  --global dotnet-ef
dotnet tool list    --global
```

Nếu báo `dotnet-ef` không phải lệnh hợp lệ, thêm đường dẫn vào PATH:
```cmd
setx PATH "%PATH%;%USERPROFILE%\.dotnet\tools"
```
Rồi mở lại cửa sổ terminal.

---

## 2. Extension VS Code

```cmd
:: .NET
code --install-extension ms-dotnettools.csdevkit
code --install-extension ms-dotnettools.csharp
code --install-extension ms-dotnettools.vscode-dotnet-runtime

:: Frontend
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension bradlc.vscode-tailwindcss
code --install-extension dsznajder.es7-react-js-snippets

:: Database & Docker
code --install-extension cweijan.vscode-mysql-client2
code --install-extension ms-azuretools.vscode-docker

:: Tiện ích
code --install-extension humao.rest-client
code --install-extension eamodio.gitlens
code --install-extension editorconfig.editorconfig
```

Kiểm tra và gỡ:
```cmd
code --list-extensions
code --uninstall-extension <extension-id>
```

---

## 3. Dựng Solution .NET

### Tạo cấu trúc thư mục

```cmd
mkdir D:\Projects\LaptopCommerce
cd D:\Projects\LaptopCommerce

dotnet new sln -n LaptopCommerce
dotnet new gitignore
dotnet new editorconfig

mkdir src src\Hosts src\BuildingBlocks src\Modules tests docker ml frontend
```

### Tạo Host projects

```cmd
dotnet new webapi -n LaptopCommerce.Api    -o src\Hosts\LaptopCommerce.Api
dotnet new worker -n LaptopCommerce.Worker -o src\Hosts\LaptopCommerce.Worker
```

> `dotnet new webapi` mặc định dùng Minimal API. Muốn Controller thì thêm `--use-controllers`.

### Tạo BuildingBlocks

```cmd
dotnet new classlib -n LaptopCommerce.SharedKernel              -o src\BuildingBlocks\LaptopCommerce.SharedKernel
dotnet new classlib -n LaptopCommerce.Application.Abstractions  -o src\BuildingBlocks\LaptopCommerce.Application.Abstractions
dotnet new classlib -n LaptopCommerce.Infrastructure.Shared     -o src\BuildingBlocks\LaptopCommerce.Infrastructure.Shared
dotnet new classlib -n LaptopCommerce.Contracts                 -o src\BuildingBlocks\LaptopCommerce.Contracts
```

### Tạo một Module (4 project theo Clean Architecture)

Ví dụ module Catalog:

```cmd
dotnet new classlib -n LaptopCommerce.Catalog.Domain         -o src\Modules\Catalog\LaptopCommerce.Catalog.Domain
dotnet new classlib -n LaptopCommerce.Catalog.Application    -o src\Modules\Catalog\LaptopCommerce.Catalog.Application
dotnet new classlib -n LaptopCommerce.Catalog.Infrastructure -o src\Modules\Catalog\LaptopCommerce.Catalog.Infrastructure
dotnet new classlib -n LaptopCommerce.Catalog.Endpoints      -o src\Modules\Catalog\LaptopCommerce.Catalog.Endpoints
```

### Script tạo nhanh tất cả module

Tạo file `scripts\create-modules.cmd`:

```cmd
@echo off
for %%M in (Identity Catalog Inventory Cart Ordering Review Wishlist Tracking Recommendation AI Analytics) do (
  echo === Tao module %%M ===
  dotnet new classlib -n LaptopCommerce.%%M.Domain         -o src\Modules\%%M\LaptopCommerce.%%M.Domain
  dotnet new classlib -n LaptopCommerce.%%M.Application    -o src\Modules\%%M\LaptopCommerce.%%M.Application
  dotnet new classlib -n LaptopCommerce.%%M.Infrastructure -o src\Modules\%%M\LaptopCommerce.%%M.Infrastructure
  dotnet new classlib -n LaptopCommerce.%%M.Endpoints      -o src\Modules\%%M\LaptopCommerce.%%M.Endpoints

  dotnet sln add src\Modules\%%M\LaptopCommerce.%%M.Domain
  dotnet sln add src\Modules\%%M\LaptopCommerce.%%M.Application
  dotnet sln add src\Modules\%%M\LaptopCommerce.%%M.Infrastructure
  dotnet sln add src\Modules\%%M\LaptopCommerce.%%M.Endpoints

  dotnet add src\Modules\%%M\LaptopCommerce.%%M.Application    reference src\Modules\%%M\LaptopCommerce.%%M.Domain
  dotnet add src\Modules\%%M\LaptopCommerce.%%M.Infrastructure reference src\Modules\%%M\LaptopCommerce.%%M.Application
  dotnet add src\Modules\%%M\LaptopCommerce.%%M.Endpoints      reference src\Modules\%%M\LaptopCommerce.%%M.Application
  dotnet add src\Modules\%%M\LaptopCommerce.%%M.Domain         reference src\BuildingBlocks\LaptopCommerce.SharedKernel
)
echo === Hoan tat ===
```

Chạy: `scripts\create-modules.cmd`

### Tạo project test

```cmd
dotnet new xunit -n LaptopCommerce.UnitTests         -o tests\LaptopCommerce.UnitTests
dotnet new xunit -n LaptopCommerce.IntegrationTests  -o tests\LaptopCommerce.IntegrationTests
dotnet new xunit -n LaptopCommerce.ArchitectureTests -o tests\LaptopCommerce.ArchitectureTests
```

---

## 4. Quản lý Project và Reference

```cmd
:: Thêm project vào solution
dotnet sln add src\Hosts\LaptopCommerce.Api\LaptopCommerce.Api.csproj

:: Thêm nhiều project cùng lúc (PowerShell)
Get-ChildItem -Recurse -Filter *.csproj | ForEach-Object { dotnet sln add $_.FullName }

:: Xem danh sách project
dotnet sln list

:: Gỡ project khỏi solution
dotnet sln remove src\Modules\Catalog\LaptopCommerce.Catalog.Domain\LaptopCommerce.Catalog.Domain.csproj

:: Thêm reference giữa project
dotnet add src\Hosts\LaptopCommerce.Api reference src\Modules\Catalog\LaptopCommerce.Catalog.Endpoints

:: Xem reference hiện có
dotnet list src\Hosts\LaptopCommerce.Api reference

:: Gỡ reference
dotnet remove src\Hosts\LaptopCommerce.Api reference src\Modules\Catalog\LaptopCommerce.Catalog.Endpoints
```

### Nối API Host tới toàn bộ module

```cmd
@echo off
for %%M in (Identity Catalog Inventory Cart Ordering Review Wishlist Tracking Recommendation AI Analytics) do (
  dotnet add src\Hosts\LaptopCommerce.Api reference src\Modules\%%M\LaptopCommerce.%%M.Endpoints
  dotnet add src\Hosts\LaptopCommerce.Api reference src\Modules\%%M\LaptopCommerce.%%M.Infrastructure
)
```

---

## 5. NuGet Package

### Cú pháp

```cmd
dotnet add <project> package <TenPackage>
dotnet add <project> package <TenPackage> --version 9.0.0
dotnet remove <project> package <TenPackage>
dotnet list <project> package
dotnet list package --outdated
dotnet restore
```

### Bộ package cho dự án này

**API Host**
```cmd
set API=src\Hosts\LaptopCommerce.Api

dotnet add %API% package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add %API% package Swashbuckle.AspNetCore
dotnet add %API% package Serilog.AspNetCore
dotnet add %API% package Serilog.Sinks.Console
dotnet add %API% package Serilog.Sinks.File
dotnet add %API% package AspNetCore.HealthChecks.MySql
dotnet add %API% package AspNetCore.HealthChecks.Redis
dotnet add %API% package AspNetCore.HealthChecks.UI.Client
```

**Application layer (mỗi module)**
```cmd
set APP=src\Modules\Catalog\LaptopCommerce.Catalog.Application

dotnet add %APP% package MediatR
dotnet add %APP% package FluentValidation
dotnet add %APP% package FluentValidation.DependencyInjectionExtensions
dotnet add %APP% package Mapster
```

**Infrastructure layer (mỗi module)**
```cmd
set INF=src\Modules\Catalog\LaptopCommerce.Catalog.Infrastructure

dotnet add %INF% package Pomelo.EntityFrameworkCore.MySql
dotnet add %INF% package Microsoft.EntityFrameworkCore
dotnet add %INF% package Microsoft.EntityFrameworkCore.Design
dotnet add %INF% package Microsoft.EntityFrameworkCore.Relational
```

> **Quan trọng:** với MySQL hãy dùng **`Pomelo.EntityFrameworkCore.MySql`**. Đây là provider được cộng đồng .NET dùng phổ biến nhất cho MySQL và bám sát phiên bản EF Core. Chọn version Pomelo có major số khớp với EF Core bạn dùng.

**Shared Infrastructure**
```cmd
set SHARED=src\BuildingBlocks\LaptopCommerce.Infrastructure.Shared

dotnet add %SHARED% package StackExchange.Redis
dotnet add %SHARED% package Microsoft.Extensions.Caching.StackExchangeRedis
dotnet add %SHARED% package Polly
dotnet add %SHARED% package Microsoft.Extensions.Http.Polly
dotnet add %SHARED% package BCrypt.Net-Next
```

**Worker**
```cmd
dotnet add src\Hosts\LaptopCommerce.Worker package Serilog.Extensions.Hosting
dotnet add src\Hosts\LaptopCommerce.Worker package Quartz.Extensions.Hosting
```

**Test**
```cmd
dotnet add tests\LaptopCommerce.UnitTests package FluentAssertions
dotnet add tests\LaptopCommerce.UnitTests package NSubstitute
dotnet add tests\LaptopCommerce.UnitTests package Bogus

dotnet add tests\LaptopCommerce.IntegrationTests package Testcontainers.MySql
dotnet add tests\LaptopCommerce.IntegrationTests package Testcontainers.Redis
dotnet add tests\LaptopCommerce.IntegrationTests package Microsoft.AspNetCore.Mvc.Testing

dotnet add tests\LaptopCommerce.ArchitectureTests package NetArchTest.Rules
```

---

## 6. Entity Framework Core + MySQL

### Cú pháp chung

Vì mỗi module có `DbContext` riêng, mọi lệnh EF đều cần chỉ rõ project chứa DbContext (`--project`), project khởi động (`--startup-project`) và tên context (`--context`).

```cmd
dotnet ef <lenh> ^
  --project src\Modules\Catalog\LaptopCommerce.Catalog.Infrastructure ^
  --startup-project src\Hosts\LaptopCommerce.Api ^
  --context CatalogDbContext
```

> Ký tự `^` là nối dòng trong CMD. Trong PowerShell dùng dấu backtick `` ` ``, trên macOS/Linux dùng `\`.

### Tạo migration

```cmd
dotnet ef migrations add InitialCatalog ^
  --project src\Modules\Catalog\LaptopCommerce.Catalog.Infrastructure ^
  --startup-project src\Hosts\LaptopCommerce.Api ^
  --context CatalogDbContext ^
  --output-dir Persistence\Migrations
```

### Áp dụng migration

```cmd
dotnet ef database update ^
  --project src\Modules\Catalog\LaptopCommerce.Catalog.Infrastructure ^
  --startup-project src\Hosts\LaptopCommerce.Api ^
  --context CatalogDbContext
```

### Các lệnh EF khác

```cmd
:: Xem danh sách migration
dotnet ef migrations list --project <inf> --startup-project <api> --context CatalogDbContext

:: Xóa migration cuối (chỉ khi CHƯA apply lên DB)
dotnet ef migrations remove --project <inf> --startup-project <api> --context CatalogDbContext

:: Quay về một migration cũ
dotnet ef database update InitialCatalog --project <inf> --startup-project <api> --context CatalogDbContext

:: Rollback toàn bộ migration của context này
dotnet ef database update 0 --project <inf> --startup-project <api> --context CatalogDbContext

:: Sinh script SQL để chạy tay trên production
dotnet ef migrations script --idempotent --output migrations\catalog.sql ^
  --project <inf> --startup-project <api> --context CatalogDbContext

:: Liệt kê tất cả DbContext trong solution
dotnet ef dbcontext list --startup-project src\Hosts\LaptopCommerce.Api

:: Xem thông tin DbContext
dotnet ef dbcontext info --project <inf> --startup-project <api> --context CatalogDbContext

:: Xóa toàn bộ database (chỉ dùng khi dev)
dotnet ef database drop --force --startup-project src\Hosts\LaptopCommerce.Api --context CatalogDbContext
```

### Script chạy migration cho toàn bộ module

`scripts\migrate-all.cmd`:
```cmd
@echo off
set API=src\Hosts\LaptopCommerce.Api
for %%M in (Identity Catalog Inventory Cart Ordering Review Wishlist Tracking Recommendation AI Analytics) do (
  echo === Migrate %%M ===
  dotnet ef database update ^
    --project src\Modules\%%M\LaptopCommerce.%%M.Infrastructure ^
    --startup-project %API% ^
    --context %%MDbContext
)
```

### Scaffold ngược từ database có sẵn (nếu cần)

```cmd
dotnet ef dbcontext scaffold ^
  "Server=localhost;Database=laptop_commerce;User=root;Password=yourpass" ^
  Pomelo.EntityFrameworkCore.MySql ^
  --project <inf> --startup-project <api> ^
  --output-dir Persistence\Entities ^
  --context-dir Persistence ^
  --context ScaffoldedContext ^
  --no-onconfiguring --use-database-names --force
```

---

## 7. Build, Run, Watch, Test

```cmd
:: Build
dotnet build
dotnet build -c Release
dotnet build --no-restore
dotnet clean

:: Chạy API
dotnet run --project src\Hosts\LaptopCommerce.Api

:: Chạy với profile và port cụ thể
dotnet run --project src\Hosts\LaptopCommerce.Api --launch-profile https
dotnet run --project src\Hosts\LaptopCommerce.Api --urls "http://localhost:5000"

:: Hot reload — dùng cái này khi code hằng ngày
dotnet watch --project src\Hosts\LaptopCommerce.Api run

:: Chạy Worker song song (mở terminal thứ hai)
dotnet run --project src\Hosts\LaptopCommerce.Worker

:: Đặt môi trường
set ASPNETCORE_ENVIRONMENT=Development
:: PowerShell: $env:ASPNETCORE_ENVIRONMENT="Development"
```

### Test

```cmd
dotnet test
dotnet test tests\LaptopCommerce.UnitTests
dotnet test --filter "FullyQualifiedName~Catalog"
dotnet test --filter "Category=Integration"
dotnet test --logger "console;verbosity=detailed"
dotnet test --collect:"XPlat Code Coverage"
dotnet test --no-build --no-restore
```

### Publish

```cmd
dotnet publish src\Hosts\LaptopCommerce.Api -c Release -o publish\api
dotnet publish src\Hosts\LaptopCommerce.Worker -c Release -o publish\worker
```

### Format code

```cmd
dotnet format
dotnet format --verify-no-changes    :: dùng trong CI để kiểm tra
```

---

## 8. User Secrets và cấu hình

Không bao giờ commit connection string hay khóa bí mật. Dùng User Secrets khi dev:

```cmd
cd src\Hosts\LaptopCommerce.Api
dotnet user-secrets init

dotnet user-secrets set "ConnectionStrings:MySql" "Server=localhost;Port=3306;Database=laptop_commerce;User=root;Password=yourpass;"
dotnet user-secrets set "ConnectionStrings:Redis" "localhost:6379"
dotnet user-secrets set "Jwt:Key" "chuoi-bi-mat-toi-thieu-32-ky-tu-cho-HS256"
dotnet user-secrets set "Jwt:Issuer" "LaptopCommerce"
dotnet user-secrets set "Jwt:Audience" "LaptopCommerceClient"
dotnet user-secrets set "Ollama:BaseUrl" "http://localhost:11434"
dotnet user-secrets set "Ollama:IntentModel" "qwen2.5:3b"
dotnet user-secrets set "Ollama:ChatModel" "qwen2.5:7b"

dotnet user-secrets list
dotnet user-secrets remove "Jwt:Key"
dotnet user-secrets clear
```

---

## 9. Dựng Frontend React + Vite

### Khởi tạo

```cmd
cd D:\Projects\LaptopCommerce
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

### Cài thư viện

```cmd
:: Routing & data
npm install react-router-dom
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install axios
npm install zustand

:: Form & validate
npm install react-hook-form zod @hookform/resolvers

:: UI
npm install -D tailwindcss @tailwindcss/vite
npm install lucide-react
npm install clsx tailwind-merge
npm install class-variance-authority

:: Tiện ích
npm install date-fns
npm install sonner
npm install recharts

:: Dev tools
npm install -D @types/node
npm install -D eslint prettier eslint-config-prettier eslint-plugin-react-hooks
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

### Thiết lập Tailwind (v4)

Với Tailwind CSS v4, cấu hình nằm trong `vite.config.ts` và file CSS, không cần `tailwind.config.js`:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
```

```css
/* src/index.css */
@import "tailwindcss";
```

> Nếu bạn dùng Tailwind v3, cách cũ vẫn đúng: `npx tailwindcss init -p` rồi cấu hình `content` trong `tailwind.config.js`.

### Cấu hình path alias cho TypeScript

```json
// tsconfig.json — thêm vào compilerOptions
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### shadcn/ui (tùy chọn nhưng rất nên dùng)

```cmd
npx shadcn@latest init
npx shadcn@latest add button card input dialog dropdown-menu select badge skeleton toast
npx shadcn@latest add table tabs sheet
```

### Tạo cấu trúc thư mục

```cmd
cd frontend\src
mkdir app shared tracking
mkdir features features\auth features\catalog features\cart features\checkout features\order
mkdir features\review features\wishlist features\recommendation features\ai-assistant features\admin
mkdir shared\api shared\components shared\hooks shared\lib shared\types
```

### File biến môi trường

`frontend\.env.development`:
```
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_ENABLE_TRACKING=true
```

`frontend\.env.production`:
```
VITE_API_BASE_URL=/api/v1
VITE_ENABLE_TRACKING=true
```

> Chỉ biến có tiền tố `VITE_` mới được đưa vào bundle. Truy cập bằng `import.meta.env.VITE_API_BASE_URL`. **Không đặt bí mật ở đây** — mọi thứ trong file này đều lộ ra trình duyệt.

---

## 10. Lệnh npm hằng ngày

```cmd
npm run dev              :: chạy dev server (http://localhost:3000)
npm run dev -- --host    :: cho phép truy cập từ thiết bị khác trong LAN
npm run dev -- --port 3001
npm run build            :: build production ra thư mục dist
npm run preview          :: xem thử bản build
npm run lint

:: Quản lý package
npm install <pkg>
npm install -D <pkg>
npm uninstall <pkg>
npm update
npm outdated
npm list --depth=0
npm audit
npm audit fix

:: Dọn dẹp khi lỗi lạ
rmdir /s /q node_modules
del package-lock.json
npm cache clean --force
npm install
```

### Test frontend

```cmd
npx vitest
npx vitest run
npx vitest --ui
npx vitest run --coverage
```

---

## 11. Docker và Docker Compose

```cmd
cd docker

:: Khởi động toàn bộ
docker compose up -d

:: Chỉ khởi động hạ tầng (dev: API và FE chạy ngoài Docker)
docker compose up -d mysql redis ollama

:: Xem trạng thái và log
docker compose ps
docker compose logs -f
docker compose logs -f api
docker compose logs --tail=100 mysql

:: Dừng
docker compose stop
docker compose down
docker compose down -v          :: XÓA LUÔN VOLUME — mất sạch dữ liệu, cẩn thận

:: Build lại
docker compose build
docker compose build --no-cache api
docker compose up -d --build

:: Vào trong container
docker compose exec mysql bash
docker compose exec api sh

:: Khởi động lại một service
docker compose restart api

:: Dọn dẹp hệ thống
docker system df
docker system prune -a
docker volume ls
```

---

## 12. Ollama

```cmd
:: Cài model
ollama pull qwen2.5:3b
ollama pull qwen2.5:7b
ollama pull gemma2:2b

:: Quản lý
ollama list
ollama ps
ollama rm gemma2:2b
ollama show qwen2.5:7b

:: Chạy thử trong terminal
ollama run qwen2.5:7b

:: Chạy server (thường tự chạy nền sau khi cài)
ollama serve
```

### Test API bằng curl

```cmd
curl http://localhost:11434/api/tags

curl http://localhost:11434/api/generate -d "{\"model\":\"qwen2.5:7b\",\"prompt\":\"Xin chao\",\"stream\":false}"
```

### Test JSON mode (dùng cho intent extraction)

```cmd
curl http://localhost:11434/api/chat -d "{\"model\":\"qwen2.5:3b\",\"format\":\"json\",\"stream\":false,\"messages\":[{\"role\":\"user\",\"content\":\"Tra ve JSON {\\\"budget\\\":20000000}\"}]}"
```

### Khi Ollama chạy trong Docker

```cmd
docker compose exec ollama ollama pull qwen2.5:7b
docker compose exec ollama ollama list
```

---

## 13. MySQL CLI

```cmd
:: Kết nối
mysql -h localhost -P 3306 -u root -p

:: Qua Docker
docker compose exec mysql mysql -u root -p laptop_commerce
```

```sql
SHOW DATABASES;
USE laptop_commerce;
SHOW TABLES;
DESCRIBE catalog_products;
SHOW INDEX FROM tracking_events;
SHOW CREATE TABLE ordering_orders;

-- Kiểm tra hiệu năng truy vấn
EXPLAIN SELECT * FROM catalog_products WHERE category_id = 3;
SHOW PROCESSLIST;

-- Kích thước bảng
SELECT table_name,
       ROUND((data_length + index_length)/1024/1024, 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = 'laptop_commerce'
ORDER BY size_mb DESC;
```

### Backup và restore

```cmd
:: Dump toàn bộ
docker compose exec mysql mysqldump -u root -p laptop_commerce > backup\dump.sql

:: Dump chỉ schema
docker compose exec mysql mysqldump -u root -p --no-data laptop_commerce > backup\schema.sql

:: Restore
docker compose exec -T mysql mysql -u root -p laptop_commerce < backup\dump.sql
```

---

## 14. Git

```cmd
git init
git add .
git commit -m "chore: khoi tao solution"
git branch -M main
git remote add origin https://github.com/<user>/laptop-commerce.git
git push -u origin main

:: Nhánh theo tính năng
git checkout -b feature/catalog-module
git add .
git commit -m "feat(catalog): them chuc nang tim kiem va loc san pham"
git push -u origin feature/catalog-module

:: Đồng bộ
git fetch --all
git pull --rebase origin main
git merge main

:: Hoàn tác
git restore <file>              :: bỏ thay đổi chưa stage
git restore --staged <file>     :: bỏ stage
git reset --soft HEAD~1         :: bỏ commit, giữ code
git reset --hard HEAD~1         :: bỏ commit VÀ code — cẩn thận

git log --oneline --graph --decorate --all
git stash
git stash pop
```

### `.gitignore` cần bổ sung

```gitignore
# .NET
bin/
obj/
publish/
*.user

# Frontend
node_modules/
dist/
.vite/

# Môi trường
.env
.env.local
appsettings.Development.json

# Dữ liệu
backup/*.sql
ml/data/*.csv
ml/models/*.pkl
logs/
```

---

## 15. Cấu hình VS Code

### `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "API",
      "type": "coreclr",
      "request": "launch",
      "preLaunchTask": "build",
      "program": "${workspaceFolder}/src/Hosts/LaptopCommerce.Api/bin/Debug/net9.0/LaptopCommerce.Api.dll",
      "cwd": "${workspaceFolder}/src/Hosts/LaptopCommerce.Api",
      "env": { "ASPNETCORE_ENVIRONMENT": "Development" },
      "serverReadyAction": {
        "action": "openExternally",
        "pattern": "\\bNow listening on:\\s+(https?://\\S+)"
      }
    },
    {
      "name": "Worker",
      "type": "coreclr",
      "request": "launch",
      "preLaunchTask": "build",
      "program": "${workspaceFolder}/src/Hosts/LaptopCommerce.Worker/bin/Debug/net9.0/LaptopCommerce.Worker.dll",
      "cwd": "${workspaceFolder}/src/Hosts/LaptopCommerce.Worker",
      "env": { "DOTNET_ENVIRONMENT": "Development" }
    },
    {
      "name": "Frontend (Chrome)",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/frontend/src"
    }
  ],
  "compounds": [
    {
      "name": "Full Stack",
      "configurations": ["API", "Worker", "Frontend (Chrome)"]
    }
  ]
}
```

> Nhớ sửa `net9.0` thành đúng target framework của bạn (`net10.0` nếu dùng .NET 10).

### `.vscode/tasks.json`

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "build",
      "type": "shell",
      "command": "dotnet build LaptopCommerce.sln",
      "group": { "kind": "build", "isDefault": true },
      "problemMatcher": "$msCompile"
    },
    {
      "label": "watch-api",
      "type": "shell",
      "command": "dotnet watch --project src/Hosts/LaptopCommerce.Api run",
      "isBackground": true,
      "problemMatcher": []
    },
    {
      "label": "watch-worker",
      "type": "shell",
      "command": "dotnet watch --project src/Hosts/LaptopCommerce.Worker run",
      "isBackground": true,
      "problemMatcher": []
    },
    {
      "label": "frontend-dev",
      "type": "shell",
      "command": "npm run dev",
      "options": { "cwd": "${workspaceFolder}/frontend" },
      "isBackground": true,
      "problemMatcher": []
    },
    {
      "label": "infra-up",
      "type": "shell",
      "command": "docker compose -f docker/docker-compose.yml up -d mysql redis ollama",
      "problemMatcher": []
    },
    {
      "label": "test",
      "type": "shell",
      "command": "dotnet test",
      "group": "test",
      "problemMatcher": "$msCompile"
    },
    {
      "label": "DEV: chay tat ca",
      "dependsOrder": "parallel",
      "dependsOn": ["watch-api", "watch-worker", "frontend-dev"],
      "problemMatcher": []
    }
  ]
}
```

Chạy bằng: `Ctrl + Shift + P` → **Tasks: Run Task** → chọn **DEV: chay tat ca**.

### `.vscode/settings.json`

```json
{
  "dotnet.defaultSolution": "LaptopCommerce.sln",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" },
  "[csharp]": { "editor.defaultFormatter": "ms-dotnettools.csharp" },
  "[typescript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "[typescriptreact]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
  "files.exclude": {
    "**/bin": true,
    "**/obj": true,
    "**/node_modules": true
  },
  "search.exclude": {
    "**/dist": true,
    "**/node_modules": true
  }
}
```

### `api.http` — test API bằng REST Client

```http
@baseUrl = http://localhost:5000/api/v1
@token = {{login.response.body.accessToken}}

### Đăng nhập
# @name login
POST {{baseUrl}}/auth/login
Content-Type: application/json

{ "email": "admin@laptop.vn", "password": "Admin@123" }

### Danh sách sản phẩm
GET {{baseUrl}}/products?page=1&pageSize=20&categoryId=1

### Thêm vào giỏ
POST {{baseUrl}}/cart/items
Authorization: Bearer {{token}}
Content-Type: application/json

{ "variantId": 501, "quantity": 1 }

### Gửi event tracking
POST {{baseUrl}}/tracking/events
Content-Type: application/json

[{ "type": "product_viewed", "payload": { "productId": 501 },
   "occurredAt": "2026-07-23T10:00:00Z", "sessionId": "s-1" }]

### Hỏi AI
POST {{baseUrl}}/ai/chat
Content-Type: application/json

{ "message": "Tôi có 20 triệu, cần laptop lập trình ASP.NET và Docker" }
```

---

## 16. Xử lý sự cố thường gặp

| Lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| `dotnet-ef does not exist` | Chưa cài tool hoặc PATH thiếu | `dotnet tool install -g dotnet-ef` rồi mở lại terminal |
| `Unable to create DbContext` | EF không tìm được cấu hình | Thêm `--startup-project` trỏ tới API, hoặc viết `IDesignTimeDbContextFactory` |
| `More than one DbContext was found` | Nhiều module cùng có DbContext | Luôn truyền `--context TenDbContext` |
| `Access denied for user 'root'` | Sai mật khẩu hoặc MySQL chưa sẵn sàng | `docker compose logs mysql`, chờ healthcheck xanh |
| `Address already in use` | Port bị chiếm | `netstat -ano \| findstr :5000` rồi `taskkill /PID <pid> /F` |
| CORS bị chặn | Chưa cấu hình CORS cho `localhost:3000` | Thêm policy CORS trong `Program.cs`, hoặc dùng proxy của Vite |
| `Cannot find module '@/...'` | Thiếu alias | Khai báo alias ở cả `vite.config.ts` và `tsconfig.json` |
| Tailwind class không ăn | Chưa import CSS hoặc sai plugin | Kiểm tra `@import "tailwindcss"` trong `index.css` và plugin trong `vite.config.ts` |
| Ollama timeout | Model lớn hơn RAM khả dụng | Đổi sang model nhỏ hơn, hoặc tăng timeout `HttpClient` |
| `Connection refused` tới Ollama | Sai host khi chạy Docker | Trong Docker dùng `http://ollama:11434`, ngoài Docker dùng `localhost` |
| `DbUpdateConcurrencyException` | Hai request cùng sửa tồn kho | Đúng như thiết kế — retry, nếu vẫn lỗi thì báo hết hàng |
| Migration đã apply nhưng muốn xóa | Không dùng `migrations remove` được | Rollback bằng `database update <MigrationTruoc>` rồi mới remove |

---

## 17. Bảng tra nhanh

### Quy trình làm việc mỗi ngày

```cmd
:: 1. Khởi động hạ tầng
cd docker && docker compose up -d mysql redis ollama && cd ..

:: 2. Terminal 1 — API
dotnet watch --project src\Hosts\LaptopCommerce.Api run

:: 3. Terminal 2 — Worker
dotnet watch --project src\Hosts\LaptopCommerce.Worker run

:: 4. Terminal 3 — Frontend
cd frontend && npm run dev
```

Hoặc gọn hơn: `Ctrl+Shift+P` → **Tasks: Run Task** → **DEV: chay tat ca**.

### Quy trình khi thêm một entity mới

```cmd
:: 1. Viết Entity trong <Module>.Domain
:: 2. Viết EntityConfiguration trong <Module>.Infrastructure/Persistence
:: 3. Tạo migration
dotnet ef migrations add Them<TenEntity> ^
  --project src\Modules\<Module>\LaptopCommerce.<Module>.Infrastructure ^
  --startup-project src\Hosts\LaptopCommerce.Api ^
  --context <Module>DbContext ^
  --output-dir Persistence\Migrations

:: 4. Xem lại file migration vừa sinh — LUÔN LUÔN đọc trước khi apply
:: 5. Áp dụng
dotnet ef database update ^
  --project src\Modules\<Module>\LaptopCommerce.<Module>.Infrastructure ^
  --startup-project src\Hosts\LaptopCommerce.Api ^
  --context <Module>DbContext
```

### Trước khi commit

```cmd
dotnet format
dotnet build
dotnet test
cd frontend && npm run lint && npm run build && cd ..
```

### Phím tắt VS Code hữu ích

| Phím | Chức năng |
|---|---|
| `Ctrl + Shift + P` | Command Palette |
| `Ctrl + P` | Mở file nhanh |
| `Ctrl + `` ` `` | Bật/tắt terminal |
| `Ctrl + Shift + `` ` `` | Terminal mới |
| `F5` | Debug |
| `Ctrl + Shift + B` | Build |
| `F12` | Đi tới định nghĩa |
| `Shift + F12` | Tìm mọi nơi tham chiếu |
| `F2` | Đổi tên toàn dự án |
| `Ctrl + .` | Quick Fix |
| `Alt + Shift + F` | Format file |
