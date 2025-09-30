import { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { Moon, Sun, GraduationCap } from "lucide-react";
import { useTheme } from "next-themes";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex items-center gap-2 rounded-2xl bg-primary text-primary-foreground px-4 py-2 shadow-soft transition-all hover:shadow-soft-lg active:scale-95"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
      <span className="hidden sm:inline">{isDark ? "Light" : "Dark"} mode</span>
    </button>
  );
}

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-veda-sky/20 via-background to-background text-foreground">
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b">
        <div className="container flex items-center justify-between py-3">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-xl text-veda-sky">
            <div className="grid place-items-center rounded-xl bg-veda-lavender/15 p-2 shadow-soft">
              <GraduationCap className="text-veda-coral" />
            </div>
            Veda
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <NavLink to="/class" className={({isActive})=>`hover:text-primary transition-colors ${isActive?"text-primary":""}`}>Class</NavLink>
            <NavLink to="/practice" className={({isActive})=>`hover:text-primary transition-colors ${isActive?"text-primary":""}`}>Practice</NavLink>
            <NavLink to="/tutor" className={({isActive})=>`hover:text-primary transition-colors ${isActive?"text-primary":""}`}>Tutor</NavLink>
            <NavLink to="/gamification" className={({isActive})=>`hover:text-primary transition-colors ${isActive?"text-primary":""}`}>Gamification</NavLink>
            <NavLink to="/settings" className={({isActive})=>`hover:text-primary transition-colors ${isActive?"text-primary":""}`}>Settings</NavLink>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/#get-started" className="rounded-2xl bg-veda-yellow text-veda-primary-ink px-4 py-2 font-semibold shadow-soft hover:shadow-soft-lg transition-all active:scale-95">Get Started</Link>
          </div>
        </div>
      </header>
      <main className="container py-8 md:py-12">{children}</main>
      <footer className="border-t mt-16">
        <div className="container py-8 text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Veda — Adaptive Learning for Everyone</p>
          <div className="flex items-center gap-4">
            <a href="#privacy" className="hover:text-foreground">Privacy</a>
            <a href="#terms" className="hover:text-foreground">Terms</a>
            <a href="#contact" className="hover:text-foreground">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
