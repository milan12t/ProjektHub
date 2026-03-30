# 🎓 ProjectHub

> Platforma za upload i pregled studentskih projekata sa autentifikacijom i per-user folder sistemom.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

---

## ✨ Funkcionalnosti

- 🔐 **Registracija i prijava** — JWT autentifikacija, sesija traje 7 dana
- 📁 **Automatski folder** — pri registraciji se kreira privatni folder za svakog studenta
- ⬆️ **Upload fajlova** — drag & drop, više fajlova istovremeno, limit 100MB po fajlu
- 💾 **Čuvanje na disku** — fajlovi se fizički čuvaju u `server/uploads/<student>/`
- 🔗 **Download linkovi** — svaki uploadovani fajl je dostupan za preuzimanje
- 📊 **Dashboard** — pregled svih projekata sortiranih po datumu uploada
- 🔍 **Pretraga** — po nazivu projekta, imenu studenta ili tagovima
- 🗑️ **Brisanje** — student može obrisati samo svoje projekte (briše i fajlove sa diska)

---

## 🗂️ Struktura projekta

```
projecthub/
├── server/                  ← Node.js + Express backend
│   ├── index.js             ← glavni server fajl
│   ├── package.json
│   ├── db.json              ← JSON baza (kreira se automatski)
│   └── uploads/             ← storage za fajlove (kreira se automatski)
│       └── marko_markovic_a3f2/
│           └── diplomski.zip
│
└── client/                  ← React frontend (Vite)
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        └── App.jsx
```

---

## 🚀 Pokretanje

### Preduslovi

- [Node.js](https://nodejs.org/) v18 ili noviji
- npm v9+

### 1. Kloniranje repozitorijuma

```bash
git clone https://github.com/vas-username/projecthub.git
cd projecthub
```

### 2. Backend (Terminal 1)

```bash
cd server
npm install
npm start
```

Server se pokreće na `http://localhost:3001`

### 3. Frontend (Terminal 2)

```bash
cd client
npm install
npm run dev
```

App se otvara na `http://localhost:5173`

---

## 🔌 API Endpointi

| Metoda | Endpoint | Opis | Auth |
|--------|----------|------|------|
| `POST` | `/api/register` | Registracija novog studenta | ❌ |
| `POST` | `/api/login` | Prijava | ❌ |
| `GET` | `/api/me` | Podaci o prijavljenom korisniku | ✅ |
| `GET` | `/api/projects` | Lista svih projekata | ✅ |
| `POST` | `/api/projects` | Upload novog projekta (multipart) | ✅ |
| `DELETE` | `/api/projects/:id` | Brisanje projekta | ✅ |
| `GET` | `/api/users/count` | Broj registrovanih studenata | ✅ |
| `GET` | `/uploads/:folder/:file` | Download fajla | ❌ |

---

## 🛠️ Tehnički stack

**Backend**
- [Express.js](https://expressjs.com/) — HTTP server
- [Multer](https://github.com/expressjs/multer) — upload fajlova
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) — hash lozinki
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) — JWT autentifikacija
- JSON fajl kao baza podataka (bez eksternih zavisnosti)

**Frontend**
- [React 18](https://react.dev/) — UI framework
- [Vite](https://vitejs.dev/) — build alat
- Inline stilovi (bez CSS frameworka)

---

## ⚙️ Konfiguracija

U `server/index.js` možete promeniti sledeće:

```js
const PORT = 3001;                    // port servera
const JWT_SECRET = "vas_tajni_kljuc"; // OBAVEZNO promeniti za produkciju!
```

Upload limit (podrazumevano 100MB):
```js
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });
```

---

## 🔒 Sigurnosne napomene

> ⚠️ Ova aplikacija je namenjena za internu/akademsku upotrebu.

Za produkcijsko okruženje preporučuje se:

- Promeniti `JWT_SECRET` u environment varijablu
- Zameniti JSON bazu pravom bazom podataka (PostgreSQL, MongoDB)
- Dodati HTTPS (SSL sertifikat)
- Konfigurisati CORS za pravi domen
- Dodati rate limiting na auth endpointe

---

## 📄 Licenca

MIT © 2024

---

<div align="center">
  Napravljeno za akademsku upotrebu 🎓
</div>
