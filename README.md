# Nuron AI — AI Employee Platform

<p align="center">
  <strong>Build, train, and deploy AI sales &amp; support agents for your business.</strong><br/>
  Not just a chatbot — a full AI employee that sells, supports, and captures leads 24/7.
</p>

---

## 🚀 Overview

Nuron AI is a production-ready SaaS platform where businesses can create intelligent AI agents, train them on their own content, and embed them on any website. Powered by **GPT-4o via Puter.js**, each agent can:

- **Sell products** with personalized recommendations
- **Capture leads** (name, email, phone, budget, interest)
- **Support customers** with trained knowledge
- **Analyze conversations** for business insights

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Animations** | Framer Motion |
| **UI Components** | shadcn/ui + Radix UI |
| **Auth** | Puter.js (free AI access) |
| **Database** | Supabase (PostgreSQL + RLS) |
| **AI Model** | GPT-4o via Puter.js |
| **Deployment** | Vercel-ready |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                          # Landing page
│   ├── layout.tsx                        # Root layout (AuthProvider)
│   ├── not-found.tsx                     # Custom 404 page
│   ├── login/page.tsx                    # Auth (Puter.js + future Supabase)
│   ├── signup/page.tsx                   # Signup redirect
│   ├── privacy/page.tsx                  # Privacy Policy
│   ├── terms/page.tsx                    # Terms of Service
│   ├── widget/[agentId]/page.tsx         # Embeddable chat widget
│   ├── api/
│   │   ├── chat/route.ts                # Chat API endpoint
│   │   └── widget/[agentId]/route.ts    # Widget config API
│   └── dashboard/
│       ├── layout.tsx                    # Dashboard sidebar layout
│       ├── page.tsx                      # Overview (stats, agents, leads)
│       ├── agents/
│       │   ├── page.tsx                  # Agent list
│       │   ├── new/page.tsx              # Create agent (3-step flow)
│       │   └── [id]/page.tsx             # Agent detail (training, embed, personality)
│       ├── leads/page.tsx                # Lead management + CSV export
│       ├── analytics/page.tsx            # Analytics dashboard
│       ├── conversations/page.tsx        # Conversation inbox
│       └── settings/page.tsx             # Account settings
├── components/
│   ├── ui/                               # shadcn primitives
│   │   ├── button.tsx, card.tsx, input.tsx, label.tsx
│   │   ├── badge.tsx, checkbox.tsx, separator.tsx, tabs.tsx
│   │   └── not-found-1.tsx               # Custom 404 component
│   └── marketing/                        # Landing page sections
│       ├── navbar.tsx, hero.tsx, features.tsx
│       ├── testimonials.tsx, pricing.tsx, footer.tsx
├── lib/
│   ├── utils.ts                          # cn() helper
│   ├── types.ts                          # TypeScript interfaces
│   ├── store.ts                          # localStorage data store (→ Supabase)
│   └── auth-context.tsx                  # Puter.js auth provider
├── public/
│   └── embed.js                          # Embeddable widget loader script
└── supabase/
    └── migration.sql                     # Database schema + RLS policies
```

---

## ⚡ Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-org/nuron-ai.git
cd nuron-ai
npm install
```

### 2. Environment Variables

```bash
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials (optional — app works without them)
```

### 3. Run Development Server

```bash
npm run dev
# Open http://localhost:3000
```

### 4. Build for Production

```bash
npm run build
npm start
```

---

## 🔐 Authentication Flow

Nuron AI uses **Puter.js** for authentication, giving users free access to GPT-4o:

1. User clicks "Sign In with Puter" on the login page
2. Puter.js popup opens for authentication
3. On success, user session is stored in the AuthContext
4. Dashboard routes are protected — unauthenticated users redirect to `/login`
5. AI chat uses the Puter.js session for free GPT-4o access

**Future Supabase Auth**: Email/password forms are pre-built but disabled. When Supabase is configured:
- Add credentials to `.env.local`
- Enable the email auth buttons
- Users get full database persistence

---

## 🤖 Agent Creation

### 3-Step Flow

1. **Basic Info** — Name, welcome message, fallback message, role (sales/support/hybrid)
2. **Personality System** — 7 sliders controlling agent behavior:
   - Friendliness (Professional ↔ Very Friendly)
   - Detail Level (Concise ↔ Very Detailed)
   - Formality (Casual ↔ Very Formal)
   - Sales Aggressiveness (Soft Sell ↔ Aggressive)
   - Emoji Usage (None ↔ Heavy)
   - Humor Level (Serious ↔ Humorous)
   - Persuasion Level (Informative ↔ Persuasive)
3. **Behavior Rules** — Toggle product recommendations, lead capture, upselling, custom instructions

---

## 📚 Training System

Train agents on multiple data sources:

| Source | Status | Description |
|--------|--------|-------------|
| **Website URLs** | ✅ Ready | Paste any URL to train |
| **Text Content** | ✅ Ready | Paste FAQs, product descriptions |
| **PDF Upload** | 🔮 Coming Soon | Upload documentation |
| **Google Sheets** | 🔮 Coming Soon | Live product catalog sync |

---

## 🔌 Widget Embed System

### How It Works

1. Go to your agent's **Embed** tab
2. Copy the one-line script tag
3. Paste it into your website's HTML before `</body>`

```html
<script src="https://your-domain.com/embed.js"
  data-agent-id="YOUR_AGENT_ID"
  data-color="#ffffff"
  data-position="bottom-right"
  async>
</script>
```

### Widget Features

- 💬 Real-time AI chat powered by GPT-4.1
- 📋 Automatic lead capture after 3 messages
- 🎨 Customizable button color and position
- 📱 Fully responsive (mobile + desktop)
- ⚡ Lightweight loader script (~3KB)
- 🔒 Sandboxed iframe for security

---

## 📊 Analytics Dashboard

Track your AI agents' performance:

- **Conversations over time** — 7-day bar chart
- **Active hours** — Hourly heatmap showing peak times
- **Common questions** — Top visitor questions
- **Top products** — Most discussed products/services
- **Conversion rate** — Lead capture percentage
- **Unanswered queries** — Questions needing attention

---

## 💾 Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `profiles` | User accounts (auto-created on signup) |
| `agents` | AI agent configurations |
| `training_sources` | URLs, text, PDFs linked to agents |
| `leads` | Captured visitor information |
| `conversations` | Chat transcripts |

### Security (Row Level Security)

- Users can only access their own agents, leads, and conversations
- Widget can create leads and conversations publicly (no auth required)
- All other operations require authenticated user matching `user_id`

Run `supabase/migration.sql` in your Supabase SQL editor to set up the schema.

---

## 🗂 Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page (hero, features, metrics, testimonials, pricing) |
| `/login` | Authentication (Puter.js + future Supabase) |
| `/privacy` | Privacy Policy |
| `/terms` | Terms of Service |
| `/dashboard` | Overview with stats, agents, leads |
| `/dashboard/agents` | Agent list with create CTA |
| `/dashboard/agents/new` | 3-step agent creation flow |
| `/dashboard/agents/[id]` | Agent detail (training, embed, personality) |
| `/dashboard/leads` | Lead table with search + CSV export |
| `/dashboard/analytics` | Charts and metrics |
| `/dashboard/conversations` | Split-pane conversation inbox |
| `/dashboard/settings` | Profile, notifications, API keys |
| `/widget/[agentId]` | Embeddable chat widget (iframe target) |

---

## 🧑‍💻 Developer Continuation Guide

### Connecting Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run `supabase/migration.sql` in the SQL Editor
3. Copy your project URL and anon key to `.env.local`
4. Replace `lib/store.ts` localStorage calls with Supabase client queries
5. Enable email auth buttons in the login page

### Adding WhatsApp Channel

1. Integrate Twilio or WhatsApp Business API
2. Create a new API route `/api/whatsapp/webhook`
3. Map incoming messages to the existing conversation system
4. Reuse the same AI chat logic from `auth-context.tsx`

### Custom AI Models

The `chatWithAI` function in `auth-context.tsx` can be modified to use different models:

```typescript
// Change the model parameter
const response = await puter.ai.chat("gpt-4o-mini", messages);
// Or use Claude
const response = await puter.ai.chat("claude-sonnet", messages);
```

---

## 📄 License

MIT — Build anything you want with this.

---

<p align="center">
  Built with ❤️ by the Nuron AI team
</p>
#   n u r o n  
 #   n u r o n  
 