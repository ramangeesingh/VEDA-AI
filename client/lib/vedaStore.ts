export type Grade = "Nursery"|"KG"|"1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9"|"10"|"11"|"12";
export type Profile = {
  grade?: Grade;
  xp: number;
  streak: number;
  badges: string[];
  leaderboard: { name: string; score: number; date: string; grade?: Grade }[];
};

const KEY = "veda:profile";

export function getProfile(): Profile {
  const raw = localStorage.getItem(KEY);
  if (!raw) return { xp: 0, streak: 0, badges: [], leaderboard: [] };
  try { return JSON.parse(raw) as Profile; } catch {
    return { xp: 0, streak: 0, badges: [], leaderboard: [] };
  }
}

export function saveProfile(p: Profile) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function setGrade(grade: Grade) {
  const p = getProfile();
  p.grade = grade;
  saveProfile(p);
}

export function addXP(amount: number) {
  const p = getProfile();
  p.xp = Math.max(0, p.xp + amount);
  saveProfile(p);
}

export function bumpStreak() {
  const p = getProfile();
  p.streak = (p.streak || 0) + 1;
  saveProfile(p);
}

export function awardBadge(badge: string) {
  const p = getProfile();
  if (!p.badges.includes(badge)) p.badges.push(badge);
  saveProfile(p);
}

export function addLeaderboard(name: string, score: number) {
  const p = getProfile();
  p.leaderboard.push({ name, score, date: new Date().toISOString(), grade: p.grade });
  p.leaderboard.sort((a,b)=>b.score-a.score);
  p.leaderboard = p.leaderboard.slice(0, 50);
  saveProfile(p);
}

const DEMO_NAMES = [
  "Aarav Sharma","Vihaan Mehta","Aadhya Patel","Advika Kapoor","Reyansh Gupta",
  "Ishita Verma","Kabir Iyer","Myra Nair","Vivaan Joshi","Anaya Rao",
];

export function ensureDemoLeaderboard() {
  const p = getProfile();
  if (p.leaderboard.length > 0) return p.leaderboard;
  const now = Date.now();
  p.leaderboard = DEMO_NAMES.map((n, i) => ({
    name: n,
    score: 100 - i * 3 - Math.floor(Math.random()*2),
    date: new Date(now - i*86400000).toISOString(),
    grade: (String(6 + (i%7)) as Grade),
  }));
  saveProfile(p);
  return p.leaderboard;
}

export function getLeaderboard(){
  const p = getProfile();
  return p.leaderboard;
}
