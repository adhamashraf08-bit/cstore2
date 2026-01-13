# cstore - Premium Store Analytics

A modern, high-performance sales dashboard built for Candy Shop, featuring real-time data visualization and branch-specific analysis.

## 🚀 Technologies

- **Frontend**: React + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database/Auth**: Supabase
- **Charts**: Recharts

## 🛠️ Local Development

1. **Clone the repository**
   ```sh
   git clone <your-repository-url>
   cd lovable
   ```

2. **Install dependencies**
   ```sh
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```sh
   npm run dev
   ```

## 🌐 Deployment (Vercel)

This project is optimized for deployment on [Vercel](https://vercel.com).

1. Push your code to a GitHub/GitLab/Bitbucket repository.
2. Import the project into Vercel.
3. Add your Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the Vercel dashboard.
4. Click **Deploy**.

## 📄 License

MIT
