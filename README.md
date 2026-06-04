# SmartRT API

Sistem manajemen RT/RW berbasis web yang dibangun menggunakan AdonisJS dan React untuk membantu pengelolaan data warga, autentikasi pengguna, serta integrasi layanan Google dan Firebase.

---

## Tech Stack

### Backend

- AdonisJS 7
- TypeScript
- PostgreSQL
- JWT Authentication
- Google OAuth
- Firebase
- InertiaJS

### Frontend

- React 19
- Vite
- TailwindCSS 4
- React Router DOM
- Heroicons
- React Icons

---

## Struktur Project

```text
smartRT-API
│
├── backend
│   ├── app
│   ├── config
│   ├── database
│   ├── providers
│   ├── start
│   ├── tests
│   └── resources
│
├── frontend
│   ├── src
│   └── public
│
└── README.md
```

---

## Instalasi

### Clone Repository

```bash
git clone <repository-url>
cd smartRT-API
```

---

## Backend Setup

Masuk ke folder backend:

```bash
cd backend
```

Install dependency:

```bash
npm install
```

Salin file environment:

```bash
cp .env.example .env
```

Konfigurasi database PostgreSQL pada file `.env`.

Jalankan migration:

```bash
node ace migration:run
```

Jalankan server:

```bash
npm run dev
```

Backend akan berjalan pada:

```text
http://localhost:3333
```

---

## Frontend Setup

Masuk ke folder frontend:

```bash
cd frontend
```

Install dependency:

```bash
npm install
```

Buat file environment:

```bash
.env
```

Isi sesuai konfigurasi backend dan Firebase.

Jalankan frontend:

```bash
npm run dev
```

Frontend akan berjalan pada:

```text
http://localhost:5173
```

---

## Scripts

### Backend

```bash
npm run dev
npm run build
npm run start
npm run test
npm run lint
npm run format
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
```

---

## Environment Variables

### Backend

Contoh:

```env
PORT=3333

DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_DATABASE=

JWT_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

### Frontend

Contoh:

```env
VITE_API_URL=http://localhost:3333

VITE_GOOGLE_CLIENT_ID=
```

---

## Features

- Authentication
- Google Login
- JWT Authorization
- User Management
- Firebase Integration
- PostgreSQL Database
- REST API
- Responsive Frontend

---

## Author

Developed by zeeinz

```

```
