# 🎓 ProjectHub — Student Project Upload Platform

## Struktura projekta

```
projecthub/
├── server/          ← Node.js + Express backend
│   ├── index.js
│   ├── package.json
│   ├── db.json      ← kreira se automatski
│   └── uploads/     ← fajlovi studenata (kreira se automatski)
│       └── marko_markovic_a3f2/
│           └── projekat.zip
└── client/          ← React frontend (Vite)
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        └── App.jsx
```

---

## Pokretanje (2 terminala)

### Terminal 1 — Backend server

```bash
cd server
npm install
npm start
```

Server se pokreće na: **http://localhost:3001**

---

### Terminal 2 — Frontend

```bash
cd client
npm install
npm run dev
```

App se otvara na: **http://localhost:5173**

---

## Funkcionalnosti

- ✅ Registracija — automatski kreira folder na serveru
- ✅ Prijava sa JWT tokenom (ostaje prijavljen)
- ✅ Upload fajlova (drag & drop, više fajlova)
- ✅ Fajlovi se fizički čuvaju u `server/uploads/<ime_studenta>/`
- ✅ Fajlovi su dostupni za download klikom na link
- ✅ Dashboard sa svim projektima sortirano po datumu
- ✅ Pretraga i filtriranje
- ✅ Brisanje sopstvenih projekata (briše i fajlove sa diska)

## Napomene

- Podaci se čuvaju u `server/db.json` (lozinke su hash-ovane bcryptom)
- Upload limit je 100MB po fajlu
- JWT token važi 7 dana
- Za produkciju promenite `JWT_SECRET` u `server/index.js`
