# ✈️ DGCA MCQ Platform — Next.js + MongoDB

A full-stack DGCA Pilot Exam MCQ platform with MongoDB persistence.

---

## 🚀 Quick Setup

### Step 1 — Install dependencies
```bash
npm install
```

### Step 2 — Set up MongoDB

**Option A: MongoDB Atlas (Free Cloud — Recommended)**
1. Go to https://cloud.mongodb.com and sign up for free
2. Create a new **Free M0 cluster**
3. Under **Database Access** → Add a database user (username + password)
4. Under **Network Access** → Add IP Address → Allow access from anywhere (0.0.0.0/0)
5. Click **Connect** → **Drivers** → Copy the connection string

**Option B: Local MongoDB**
```bash
# Install MongoDB locally, then use:
mongodb://localhost:27017/dgca_mcq
```

### Step 3 — Configure .env.local
Edit `.env.local` and paste your MongoDB URI:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dgca_mcq?retryWrites=true&w=majority
```
> Replace `username`, `password`, and `cluster` with your actual Atlas values.

### Step 4 — Run the app
```bash
npm run dev
# Open http://localhost:3000
```

---

## 📁 Project Structure

```
dgca-mcq/
├── app/
│   ├── api/
│   │   ├── user/route.js          ← POST/GET user (register/fetch)
│   │   ├── results/route.js       ← POST/GET test results
│   │   ├── leaderboard/route.js   ← POST/GET leaderboard
│   │   └── stats/route.js         ← GET computed stats
│   ├── login/page.jsx
│   ├── dashboard/page.jsx
│   ├── test/[chapterId]/page.jsx
│   ├── leaderboard/page.jsx
│   ├── results/page.jsx
│   ├── admin/page.jsx
│   ├── layout.jsx
│   ├── globals.css
│   └── page.jsx
├── data/
│   └── questions.js               ← 50 DGCA questions (5 chapters × 10)
├── lib/
│   ├── mongoose.js                ← MongoDB connection (cached)
│   ├── models.js                  ← Mongoose schemas
│   └── storage.js                 ← API helper functions (replaces localStorage)
├── .env.local                     ← YOUR MongoDB URI goes here
├── next.config.js
└── package.json
```

---

## 🗄️ MongoDB Collections

| Collection    | Description                                      |
|---------------|--------------------------------------------------|
| `users`       | Registered users (name, email, phone, joinedAt)  |
| `results`     | Test results per user (max 50 per user)           |
| `leaderboards`| Aggregated accuracy rankings                     |

---

## 🔐 Admin Panel

Navigate to `/admin` and use password: **`dgca@admin2024`**

Admin panel lets you add/edit/delete chapters and questions stored in MongoDB-backed localStorage keys (separate from the main question bank in `data/questions.js`).

---

## 🌐 Deploy to Vercel

```bash
npm install -g vercel
vercel
```

When prompted, add the environment variable:
- **Key:** `MONGODB_URI`
- **Value:** your Atlas connection string

---

## 📚 Chapters & Questions

| Chapter           | Questions |
|-------------------|-----------|
| Air Regulations   | 10        |
| Meteorology       | 10        |
| Air Navigation    | 10        |
| Technical General | 10        |
| Radio Telephony   | 10        |
| **Total**         | **50**    |
