export type Hero = {
  name: string;
  skill: string;
  area: string;
  responses: number;
  distanceM: number;
};

export const HEROES: Hero[] = [
  { name: "Dr. Priya Sharma", skill: "Cardiologist", area: "Koramangala", responses: 142, distanceM: 280 },
  { name: "Rajesh Kumar", skill: "CPR Trained", area: "Indiranagar", responses: 118, distanceM: 410 },
  { name: "Nurse Anita Patel", skill: "Nurse", area: "HSR Layout", responses: 97, distanceM: 520 },
  { name: "Dr. Amit Singh", skill: "Doctor", area: "Whitefield", responses: 88, distanceM: 640 },
  { name: "Suresh Nair", skill: "Paramedic", area: "BTM Layout", responses: 76, distanceM: 720 },
  { name: "Kavita Reddy", skill: "First Aider", area: "Jayanagar", responses: 64, distanceM: 810 },
  { name: "Dr. Vikram Mehta", skill: "Doctor", area: "Marathahalli", responses: 58, distanceM: 940 },
  { name: "Pooja Iyer", skill: "Nurse", area: "Electronic City", responses: 51, distanceM: 1100 },
];
