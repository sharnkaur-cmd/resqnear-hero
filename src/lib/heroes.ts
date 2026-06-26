export type Hero = {
  name: string;
  skill: string;
  area: string;
  responses: number;
  distanceM: number;
  avgResponse: string;
};

// Leaderboard — top community heroes
export const HEROES: Hero[] = [
  { name: "Dr. Arjun Sharma", skill: "Doctor", area: "Koramangala", responses: 47, distanceM: 280, avgResponse: "2.4 min" },
  { name: "Nurse Kavita Singh", skill: "Nurse", area: "Indiranagar", responses: 38, distanceM: 410, avgResponse: "2.8 min" },
  { name: "Dr. Meena Patel", skill: "Doctor", area: "HSR Layout", responses: 35, distanceM: 520, avgResponse: "3.1 min" },
  { name: "Paramedic Ravi Krishnan", skill: "Paramedic", area: "Whitefield", responses: 29, distanceM: 640, avgResponse: "3.3 min" },
  { name: "Dr. Rohit Verma", skill: "Doctor", area: "BTM Layout", responses: 24, distanceM: 720, avgResponse: "3.5 min" },
  { name: "Dr. Sunita Rao", skill: "Doctor", area: "Jayanagar", responses: 21, distanceM: 810, avgResponse: "3.8 min" },
  { name: "Nurse Pooja Mehta", skill: "Nurse", area: "Marathahalli", responses: 18, distanceM: 940, avgResponse: "4.0 min" },
  { name: "Dr. Deepa Joshi", skill: "Doctor", area: "Electronic City", responses: 15, distanceM: 1100, avgResponse: "4.2 min" },
];

// Random hero pool for live matching (different each emergency)
export const HERO_POOL: Hero[] = [
  { name: "Dr. Arjun Sharma", skill: "Cardiologist", area: "Koramangala", responses: 47, distanceM: 240, avgResponse: "2.4 min" },
  { name: "Dr. Meena Patel", skill: "Emergency Physician", area: "HSR Layout", responses: 35, distanceM: 310, avgResponse: "3.1 min" },
  { name: "Dr. Suresh Kumar", skill: "General Physician", area: "JP Nagar", responses: 32, distanceM: 380, avgResponse: "2.9 min" },
  { name: "Nurse Kavita Singh", skill: "ICU Nurse", area: "Indiranagar", responses: 38, distanceM: 420, avgResponse: "2.8 min" },
  { name: "Dr. Rohit Verma", skill: "Trauma Specialist", area: "BTM Layout", responses: 24, distanceM: 290, avgResponse: "3.5 min" },
  { name: "Paramedic Anita Nair", skill: "Paramedic", area: "Whitefield", responses: 41, distanceM: 510, avgResponse: "3.0 min" },
  { name: "Dr. Vikram Reddy", skill: "Cardiologist", area: "Bellandur", responses: 28, distanceM: 360, avgResponse: "3.2 min" },
  { name: "Nurse Pooja Mehta", skill: "Trauma Nurse", area: "Marathahalli", responses: 18, distanceM: 470, avgResponse: "4.0 min" },
  { name: "Dr. Amit Iyer", skill: "Emergency Physician", area: "Sarjapur", responses: 26, distanceM: 530, avgResponse: "3.4 min" },
  { name: "Dr. Sunita Rao", skill: "Pediatrician", area: "Jayanagar", responses: 21, distanceM: 410, avgResponse: "3.8 min" },
  { name: "CPR Expert Ravi Krishnan", skill: "CPR Trained", area: "Whitefield", responses: 29, distanceM: 260, avgResponse: "2.5 min" },
  { name: "Dr. Deepa Joshi", skill: "General Physician", area: "Electronic City", responses: 15, distanceM: 490, avgResponse: "4.2 min" },
];

export function pickRandomHero(seedRef?: { last?: string }): Hero {
  let idx = Math.floor(Math.random() * HERO_POOL.length);
  if (seedRef?.last) {
    let tries = 0;
    while (HERO_POOL[idx].name === seedRef.last && tries < 5) {
      idx = Math.floor(Math.random() * HERO_POOL.length);
      tries++;
    }
  }
  const hero = { ...HERO_POOL[idx] };
  // Add a touch of jitter for realism
  hero.distanceM = Math.max(120, hero.distanceM + Math.floor(Math.random() * 160) - 80);
  if (seedRef) seedRef.last = hero.name;
  return hero;
}
