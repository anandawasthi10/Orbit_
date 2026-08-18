<div align="center">

  <img src="public/orbit-logo.png" alt="Orbit Logo" width="120" height="120" />

  # 🚀 Orbit

  ### *The Ultimate Command Center for High-Performance Team Sprints*

  [![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.7-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
  [![NextAuth](https://img.shields.io/badge/NextAuth.js-JWT-purple?style=for-the-badge&logo=next.js)](https://next-auth.js.org/)
  [![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

  <p align="center">
    A modern, full-stack sprint management workspace that unifies project progress tracking, drag-and-drop task Kanban boards, code-based team membership, activity feeds, and developer onboarding.
  </p>

  [Live Demo](https://orbitworkk.vercel.app) &nbsp;&bull;&nbsp; [Report Issue](https://github.com/anandawasthi10/Orbit_/issues) &nbsp;&bull;&nbsp; [Request Feature](https://github.com/anandawasthi10/Orbit_/issues)

</div>

---

## 🌟 Key Features

### 📊 1. Sprint Command Center & Analytics
- **Live Progress Gauges**: Real-time progress metric cards tracking overall sprint completion %, active tasks, completed milestones, and team headcount.
- **Interactive Recharts Graphs**: Dynamic Area and Line graphs tracking **Planned vs. Actual Sprint Progress** over customizable timeframes (*This Week*, *This Month*, *All Time*).

### 🗂️ 2. Drag-and-Drop Task Kanban Board
- **Fluid Inter-Column Dragging**: Built with `@dnd-kit` for seamless drag-and-drop task movement between **To Do**, **In Progress**, and **Completed** columns.
- **Granular Categories**: Color-coded task tags (*Research*, *Frontend*, *Backend*, *DevOps*, *UI/UX*, *Documentation*, *General*).
- **Role-Based Task Claiming**: Admin/Lead task assignments or instant *"Assign to Me & Start"* single-click action for team members.
- **Multi-Project Filtering**: Filter workspace tasks by specific projects or view all sprint deliverables.

### 👥 3. Team Workspaces & Access Code Join Engine
- **Unique 6-Character Join Codes**: Create teams and instantly share 6-character uppercase access codes (e.g., `K7XQ2M`) to invite teammates.
- **Team Roster Management**: Real-time team roster displaying leader badges, join timestamps, member roles, and email contacts.

### 📁 4. Project Workspace Management
- Track multiple concurrent project initiatives, calculate real-time completion percentages based on task deliverables, and set target completion dates.

### 🔐 5. Robust Security & Middleware Route Protection
- **Bcrypt Password Hashing**: Passwords encrypted with 10 salt rounds.
- **NextAuth JWT Sessions**: Custom HTTP-only session tokens (`orbit.session-token`).
- **Smart Middleware Enforcement**: Automatically protects private routes and redirects incomplete user profiles to onboarding.

### 💾 6. Resilient Dual-Mode Data Architecture
- **MongoDB + Mongoose ODM**: Full Mongo DB support when database URI is configured.
- **Automated Serverless / EROFS Fallback**: Dynamically detects read-only runtime environments (such as Vercel or AWS Lambda) and seamlessly falls back to `/tmp` and in-memory persistence—guaranteeing **100% crash-free account creation and logins**.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technologies |
| :--- | :--- |
| **Framework** | [Next.js 14.2](https://nextjs.org/) (App Router) |
| **UI Library** | [React 18](https://reactjs.org/) |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/), Lucide React Icons |
| **State & Drag-and-Drop** | [@dnd-kit/core](https://dndkit.com/), `@dnd-kit/sortable` |
| **Data Visualization** | [Recharts](https://recharts.org/) |
| **3D Engine** | Three.js, `@react-three/fiber`, `@react-three/drei` |
| **Database** | MongoDB (Mongoose) + Fallback File & Memory Store |
| **Authentication** | NextAuth.js (Credentials Provider + JWT Strategy) |
| **Password Hashing** | Bcryptjs |

---

## 📁 Repository Structure

```
Orbit_/
├── app/                      # Next.js App Router pages & API handlers
│   ├── api/                  # REST API endpoints (auth, tasks, projects, teams)
│   ├── daily-updates/        # Team activity feed & standups
│   ├── dashboard/            # Command center with Recharts & Kanban preview
│   ├── login/                # Sign-in authentication page
│   ├── onboarding/           # Profile setup & skill onboarding
│   ├── projects/             # Project workspace manager
│   ├── resources/            # Knowledge base & team link library
│   ├── signup/               # Account creation page
│   ├── tasks/                # Interactive Drag-and-Drop Kanban Board
│   ├── team/                 # Member directory
│   └── teams/                # Team creation & code join page
├── components/               # Layout & UI components (AppShell, Sidebar, TopHeader)
├── data/                     # Seed JSON data files
├── lib/                      # Infrastructure core
│   ├── authOptions.js        # NextAuth options & session callbacks
│   ├── db.js                 # MongoDB connection manager with 3s fast timeout
│   └── fileDb.js             # Fault-tolerant storage engine (EROFS protected)
├── models/                   # Smart Proxy Models (MongoDB / File Store switchers)
├── middleware.js             # Route protection & onboarding redirect engine
└── public/                   # Static assets & branding logos
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm** or **yarn** or **pnpm**

### 1. Clone the Repository
```bash
git clone https://github.com/anandawasthi10/Orbit_.git
cd Orbit_
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory:

```env
# NextAuth Configuration
NEXTAUTH_SECRET=orbit-super-secret-key-1234567890-v2
NEXTAUTH_URL=http://localhost:3000

# Optional: MongoDB Database Connection String
# If omitted, Orbit will automatically operate in offline local/tmp storage mode.
MONGODB_URI=mongodb://127.0.0.1:27017/teamos
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deploying to Vercel

Orbit is fully optimized for **Vercel** serverless deployment out of the box.

1. Push your code to GitHub.
2. Import your repository into [Vercel](https://vercel.com).
3. Set the Environment Variables in Vercel Dashboard:
   - `NEXTAUTH_SECRET` (generate a random string)
   - `NEXTAUTH_URL` (your deployment URL, e.g. `https://orbitworkk.vercel.app`)
   - `MONGODB_URI` (optional: your MongoDB Atlas URI)
4. Click **Deploy**.

> **Note on Serverless Storage**: Orbit includes a built-in `EROFS` (Read-Only Filesystem) fallback handler. Even if `MONGODB_URI` is not configured on Vercel, users can create accounts, log in, and interact with the application without experiencing server crashes.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check the [issues page](https://github.com/anandawasthi10/Orbit_/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <sub>Built with ❤️ for high-performance engineering teams.</sub>
</div>
