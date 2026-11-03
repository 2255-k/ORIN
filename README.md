# ORIN

**Connect Beyond Words.**

ORIN is a real-time messaging platform built with the MERN stack and Socket.IO. It supports authenticated sessions, one-to-one and group chats, attachments, presence, and a dark/light professional interface.

## Architecture

- `client/` — React 19, Vite, TypeScript, Tailwind CSS, Zustand, Socket.IO client
- `server/` — Express, MongoDB/Mongoose, JWT HTTP-only cookies, Socket.IO
- Attachments upload to Cloudinary when credentials are present, otherwise to `server/uploads/`

## Prerequisites

- Node.js 20+
- MongoDB 6+ running locally, or a MongoDB Atlas URI
- Optional: Cloudinary account for remote media
- Optional: SMTP credentials for password-reset emails

## Setup

```bash
copy .env.example .env
npm install
npm install --prefix server
npm install --prefix client
```

Update `.env` with `MONGODB_URI` and a long `JWT_SECRET`. Leave Cloudinary and SMTP blank for local-only mode.

### Local MongoDB

```bash
mongod
```

The default database name is `orin`.

### Cloudinary (optional)

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. Without these, files are stored on disk and served from `/uploads`.

### Password reset email (optional)

Set `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS`. If SMTP is not configured, reset links are written to the server log in development.

## Run

From the repository root:

```bash
npm run dev
```

- Client: http://localhost:5173
- API / Socket.IO: http://localhost:5000

Root scripts:

- `npm run dev` — client and server together
- `npm run typecheck`
- `npm run build`

## Auth model

Sessions use a signed JWT in an HTTP-only cookie (`orin_token`). The SPA never stores access tokens in `localStorage`. Protected API routes and Socket.IO connections both require that cookie.

## Real-time events

Socket.IO rooms:

- `user:<id>` — conversation list updates and notifications
- `conversation:<id>` — messages, typing, and read receipts

Messages are persisted in MongoDB before they are broadcast.

## Known limitations

- Voice and video buttons are present in the chat header but WebRTC media calling is not implemented.
- Browser desktop notifications are requested only when enabled in Settings, not on first page load.
- Password-reset email delivery requires SMTP. Cloudinary is required only if you do not want local disk storage.

## Troubleshooting

- **MongoDB connection error** — confirm `mongod` is running and `MONGODB_URI` is correct.
- **Socket disconnects** — keep the API on port 5000; the Vite dev server proxies `/socket.io`.
- **Uploads fail** — check file type (images, PDF, ZIP, DOCX, TXT) and `MAX_UPLOAD_MB`.
- **CORS / cookies in production** — set `CLIENT_URL` to the real origin, `COOKIE_SECURE=true`, and HTTPS.
