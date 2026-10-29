# Adaptive Tutor Frontend (`adaptive-tutor-frontend`)

Adaptive Tutoring Web Application tailored for neurodivergent learners (ADHD, autism spectrum). Wired directly to the `adaptive-tutor-backend` FastAPI services using Supabase JWT authentication.

## Tech Stack
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS
- **State & Data Fetching**: TanStack Query (React Query) v5
- **Charts**: Recharts
- **Icons**: Lucide React
- **Auth**: Supabase Auth SDK (`@supabase/supabase-js`)
- **Testing**: Vitest + React Testing Library + JSDOM

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env`:
   ```bash
   VITE_SUPABASE_URL=https://<your-supabase-project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   VITE_API_BASE_URL=http://localhost:8000
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Run Unit Tests**:
   ```bash
   npm run test
   ```

5. **Run E2E Validation**:
   ```bash
   npm run test:e2e
   ```
