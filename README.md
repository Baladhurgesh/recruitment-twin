# Bala's Digital Twin

An AI-powered personal recruitment page featuring a conversational voice agent. Visitors can have a real-time voice conversation with a digital twin to learn about projects, skills, and experience.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)

## ✨ Features

- **Voice AI Agent** — Real-time conversational interface powered by ElevenLabs
- **Audio Visualizer** — Dynamic orb that responds to speech with smooth animations
- **Contact Form** — Validated form submissions stored in Supabase
- **Modern UI** — Glass-morphism design with gradient backgrounds

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Voice AI | [ElevenLabs Conversational AI](https://elevenlabs.io) |
| Database | [Supabase](https://supabase.com) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| Language | TypeScript |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- ElevenLabs account with a configured AI agent
- Supabase project with a `contact_submissions` table

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# ElevenLabs — server only. Do not use NEXT_PUBLIC_ for these.
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_AGENT_ID=your_private_agent_id

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Set the agent to **Private** in the ElevenLabs dashboard. The site mints a short-lived WebRTC token from `/api/conversation-token` so the API key and agent ID never ship to the browser. The same endpoint is used by [baladhurgesh.github.io](https://baladhurgesh.github.io/).

### Leave-a-message tool

The agent can take a message for Bala via a `leave_message` client tool (params: `message` required, `name` and `contact` optional). Both this site and baladhurgesh.github.io POST it to `/api/leave-message`, which emails it via [Resend](https://resend.com). Set `RESEND_API_KEY` and `MESSAGE_TO_EMAIL` (and optionally `MESSAGE_FROM_EMAIL`) in Vercel. The endpoint allows only listed origins and 5 messages per IP per hour.

### Supabase Setup

Create a `contact_submissions` table in your Supabase project:

```sql
CREATE TABLE contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow inserts from the client
CREATE POLICY "Allow public inserts" ON contact_submissions
  FOR INSERT WITH CHECK (true);
```

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/bala-recruitment-twin.git
cd bala-recruitment-twin

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── contact/
│   │       └── route.ts      # Contact form API endpoint
│   ├── contact/
│   │   └── page.tsx          # Contact form page
│   ├── globals.css           # Global styles & Tailwind
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page with voice agent
├── components/
│   └── VoiceAgent.tsx        # ElevenLabs voice widget
└── lib/
    └── supabase.ts           # Supabase client & types
```

## 🔧 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## 🌐 Deployment

Deploy easily with [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/bala-recruitment-twin)

Don't forget to add your environment variables in the Vercel dashboard.

## 📝 License

MIT
