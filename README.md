# CAMPUS PREMIER LEAGUE — LIVE PLAYER AUCTION PLATFORM 🏏

> A production-grade collegiate cricket tournament player auction platform inspired by the televised Indian Premier League (IPL) auction experience. Supports exactly 6 default teams, live bidding by authenticated franchise owners, an auctioneer control desk, real-time Socket.IO synchronization, automatic Indian Rupee (₹) purse accounting, Google Sheets player import with column mapping, and audited transaction reversals.

---

## 🌟 Key Highlights & Architecture

- **Visual Identity**: Stadium broadcast aesthetics with midnight navy (`#070B14`), metallic gold (`#F59E0B`), emerald green (`#10B981`) for successful buys, and ruby red (`#EF4444`) for errors and unsold players.
- **Authoritative Server Engine**: Node.js & Express.js with Mongoose. Never trusts client timestamps, purse values, or bid amounts.
- **Concurrency & Transaction Safety**: Optimistic version locking (`sessionVersion`) with atomic Mongoose transitions and MongoDB multi-document transactions when deployed to replica sets (e.g. MongoDB Atlas). Competing simultaneous bids are strictly serialized.
- **Real-Time WebSockets**: Socket.IO with room authorization (`tournament:<id>:public`, `tournament:<id>:admin`, `tournament:<id>:team:<teamId>`) and automatic reconnect state reconciliation.
- **Google Sheets & CSV Importer**: Dedicated admin interface supporting CSV file uploads or direct Google Sheet URLs, dynamic header mapping, data validation, duplicate detection, and protection of SOLD records.
- **Web Audio API Sound Engine**: Zero-asset, zero-latency synthesizer sounds for gavel strikes, bid chimes, countdown ticks, and victory fanfare.
- **Automated Test Suite**: Vitest test suite covering authentication, RBAC, opening bids, increments, purse limits, concurrency, SOLD/UNSOLD state transitions, transaction reversals, and spreadsheet imports.

---

## 📂 Project Structure

```text
Auction_Website/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Navbar, Footer, Badges, Modals
│   │   │   ├── auction/        # CurrentPlayerCard, LiveBiddingWidget, SixTeamGrid, BidHistoryStream, AuctioneerControlBar, NominationModal
│   │   │   ├── team/           # Team cards and squad tables
│   │   │   └── player/         # Player cards and stats
│   │   ├── context/            # AuthContext, AuctionSocketContext, SoundContext
│   │   ├── layouts/            # MainLayout with stadium lights and celebratory banners
│   │   ├── pages/              # Home, LiveAuction, Teams, Players, History, Login, OwnerDashboard, AdminDashboard
│   │   ├── services/           # Axios API service
│   │   ├── socket/             # Socket.IO client instance and auth synchronization
│   │   ├── utils/              # formatters (INR, time), soundEffects (Web Audio API)
│   │   ├── App.jsx             # React Router configuration
│   │   ├── index.css           # Tailwind directives and custom glass-panel styling
│   │   └── main.jsx            # React root mount
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── config/             # constants.js, db.js (MongoDB Atlas + embedded fallback)
│   │   ├── controllers/        # auth, tournament, team, player, auction, report
│   │   ├── middleware/         # auth (JWT), role (RBAC), tournamentAuth, rateLimiter, errorHandler
│   │   ├── models/             # User, Tournament, Team, Player, AuctionSession, Bid, Purchase, AuctionEvent, AuditLog
│   │   ├── routes/             # Express API routes
│   │   ├── services/           # auctionService, playerService, teamService, reportService, googleSheetsService
│   │   ├── sockets/            # Socket.IO room management, bidding events, timer ticker
│   │   └── utils/              # currency.js, seed.js (comprehensive 6-team + 30-player seeder)
│   ├── test/                   # Vitest automated test suite (auction.test.js)
│   ├── package.json
│   └── server.js               # HTTP & Socket.IO server boot
├── sample-players.csv          # Sample CSV for testing player import
├── .env.example                # Example environment variables
├── .gitignore
├── package.json                # Root orchestration scripts
└── README.md
```

---

## ⚙️ Prerequisites

1. **Node.js**: v18.0.0 or higher (v20+ recommended)
2. **npm**: v9.0.0 or higher
3. **MongoDB**: MongoDB Atlas cluster (free M0 cluster or higher) or local MongoDB.
   > **Note**: For local development and test runs without external setup, the backend automatically uses an embedded `mongodb-memory-server` replica set out of the box!

---

## 🚀 Quick Start (Local Development)

### 1. Install All Dependencies

From the project root:

```bash
npm run install:all
```

Or install in each directory:

```bash
npm install
npm --prefix server install
npm --prefix client install
```

### 2. Environment Configuration

Copy the example environment files:

```bash
# Server environment
cp .env.example server/.env

# Client environment
cp client/.env.example client/.env
```

Default local `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/campus-premier-league
JWT_SECRET=campus_premier_league_jwt_secret_key_2026_production_grade
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Default local `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Seed the Database

Populate the database with the tournament, 6 teams, admin/auctioneer/team owner accounts, and 30+ college players:

```bash
npm run seed
```

### 4. Run Frontend and Backend Concurrently

```bash
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **WebSocket Gateway**: `http://localhost:5000`

---

## 🔑 Pre-Seeded Demo Credentials

You can log in manually or click the **Instant Demo Access** pills on the `/login` page:

| Role | Name | Email | Password | Assigned Franchise |
|---|---|---|---|---|
| **Super Admin** | Rajesh Malhotra | `admin@cpl.edu` | `Admin@123456` | Tournament Director |
| **Auctioneer** | Charu Sharma | `auctioneer@cpl.edu` | `Auctioneer@123456` | Gavel Master |
| **Team Owner 1** | Vikram Rathore | `owner1@cpl.edu` | `Owner@123456` | Apex Predators (`APX`) |
| **Team Owner 2** | Aarav Sharma | `owner2@cpl.edu` | `Owner@123456` | Titan Strikers (`STR`) |
| **Team Owner 3** | Kabir Mehta | `owner3@cpl.edu` | `Owner@123456` | Royal Challengers Campus (`RCC`) |
| **Team Owner 4** | Rohan Varma | `owner4@cpl.edu` | `Owner@123456` | Falcon Blasters (`FLC`) |
| **Team Owner 5** | Aditya Singh | `owner5@cpl.edu` | `Owner@123456` | Spartan Knights (`SPK`) |
| **Team Owner 6** | Devansh Kapoor | `owner6@cpl.edu` | `Owner@123456` | Viper Warriors (`VPW`) |

---

## 🧪 Automated Testing

Run the test suite:

```bash
npm test
```

The test suite validates:
1. Public scoreboard accessibility without login credentials.
2. RBAC guards preventing viewers and owners from invoking auctioneer operations.
3. Accurate opening bid and minimum increment calculations.
4. Rejection of bids below player base price.
5. Prevention of consecutive self-outbidding by leading team.
6. Rejection of bids exceeding remaining team purse.
7. Prevention of bidding on behalf of competing franchises.
8. Idempotency key handling for duplicate bid submissions.
9. Serialization and optimistic version locking under concurrent simultaneous bids.
10. Atomic SOLD settlement: player ownership, committed spent, remaining purse deduction.
11. UNSOLD handling without fund deduction.
12. Superadmin transaction reversal with mandatory audit log and restored purse.
13. CSV/Google Sheets preview validation and column mapping.
14. Preservation of already SOLD players during spreadsheet re-imports.

---

## 📊 Google Sheets Player Import Guide

1. Log in as **Super Admin** (`admin@cpl.edu`) or **Auctioneer** (`auctioneer@cpl.edu`).
2. Navigate to **Admin Console** (`/admin`) → **Import Players (Sheets/CSV)**.
3. Choose either:
   - **Option A**: Paste a Google Sheet URL (ensure the sheet sharing setting is *"Anyone with the link can view"*).
   - **Option B**: Upload a `.csv` file (a starter file `sample-players.csv` is provided in the repository root).
4. Click **Inspect & Map Columns**.
5. The interface previews your rows and allows mapping arbitrary spreadsheet headers to database fields:
   - Full Name
   - Playing Role (Batsman, Bowler, All-Rounder, Wicket-Keeper)
   - Base Price in INR
   - Department & Academic Year
   - Category (Marquee, Category A, Category B, Emerging)
   - Photo URL
   - Player ID / Registration Number
6. Review row validation: errors and duplicates are highlighted in red.
7. Click **Confirm Import** to save valid records to MongoDB.

---

## 🔨 Production Deployment

### 1. Database: MongoDB Atlas

1. Create a free or dedicated cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user and whitelist network access (`0.0.0.0/0` or your Render IP).
3. Copy your connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/campus-auction?retryWrites=true&w=majority
   ```
   > MongoDB Atlas runs as a replica set, automatically enabling multi-document transactions!

### 2. Backend: Render

1. Create a **New Web Service** connected to your repository on [Render](https://render.com).
2. **Root Directory**: `server`
3. **Build Command**: `npm install`
4. **Start Command**: `node server.js`
5. Configure Environment Variables:
   - `PORT`: `5000` (or leave default assigned by Render)
   - `MONGODB_URI`: your MongoDB Atlas URI
   - `JWT_SECRET`: a secure 64-character random string
   - `CLIENT_URL`: your Vercel frontend URL (e.g. `https://campus-premier-league.vercel.app`)
   - `NODE_ENV`: `production`

### 3. Frontend: Vercel

1. Import the repository on [Vercel](https://vercel.com).
2. **Root Directory**: `client`
3. **Framework Preset**: `Vite`
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`
6. Configure Environment Variables:
   - `VITE_API_URL`: your Render backend URL + `/api` (e.g. `https://cpl-backend.onrender.com/api`)
   - `VITE_SOCKET_URL`: your Render backend URL (e.g. `https://cpl-backend.onrender.com`)
7. Deploy!

---

## 🛡️ Security & Integrity Practices

- **Zero-Trust Client Submissions**: Bids, deadlines, purse amounts, and user privileges are authenticated and calculated server-side.
- **Idempotency Keys**: Network retries will not duplicate or misprice bids.
- **Audited Reversals**: Mistakes can be corrected only by Superadmin with mandatory justification and immutable audit logs.
- **Rate Limiting**: Express rate limiters protect authentication endpoints and auction bid submission streams.
- **CORS & Helmet**: Strict cross-origin resource sharing configured for production domains.
