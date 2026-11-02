# Ki Hurn Portfolio

A modern developer portfolio website built with **React**, **Supabase**, and deployed on **Vercel**.

---

## 🛠️ Tech Stack

- **Frontend:** [React](https://react.dev) + [Vite](https://vitejs.dev)
- **Backend & Auth:** [Supabase](https://supabase.com)
- **Deployment:** [Vercel](https://vercel.com)
- **Icons:** [Lucide React](https://lucide.dev)

---

## 📂 Project Structure

```text
├── public/                 # Static assets (favicons, images)
│   └── vite.svg
├── src/
│   ├── assets/             # Images, fonts, and graphics
│   ├── components/         # Reusable React components
│   │   ├── layout/         # Header/Navbar, Footer, Layout wrappers
│   │   └── ui/             # Reusable UI primitives (buttons, cards, badges)
│   ├── context/            # Global context (e.g., Supabase AuthContext)
│   ├── hooks/              # Custom React hooks (useAuth, data hooks)
│   ├── lib/                # Third-party client setups (supabase.js)
│   ├── pages/              # Page views (Home, Projects, About, etc.)
│   ├── services/           # Backend API services & Supabase database queries
│   ├── App.css             # Component-level styles
│   ├── App.jsx             # Root React application
│   ├── index.css           # Global CSS variables, theme, and resets
│   └── main.jsx            # Application entry point
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── index.html              # HTML shell
├── package.json            # Project dependencies and npm scripts
├── vercel.json             # Vercel SPA routing and configuration
├── vite.config.js          # Vite bundler configuration & '@/' alias
└── README.md               # Project documentation
```

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/kihurn/kihurn.git
cd kihurn
npm install
```

### 2. Configure Supabase Environment Variables

Copy the template:

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## ☁️ Deploying to Vercel

1. Push your changes to GitHub:
   ```bash
   git push origin main
   ```
2. In your [Vercel Dashboard](https://vercel.com):
   - Click **Add New Project** > **Import Git Repository**.
   - Select **kihurn/kihurn**.
   - Add your environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`).
   - Click **Deploy**.
3. Every subsequent push to `main` will trigger an automatic production deployment.

---

## 📜 License

MIT
