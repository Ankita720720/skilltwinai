export type AptCategory = 'Quantitative' | 'Logical' | 'Verbal' | 'Data Interpretation';
export interface AptQuestion { id: string; cat: AptCategory; prompt: string; options: string[]; correct: number; explanation: string }

const Q = (id: string, cat: AptCategory, prompt: string, options: string[], correct: number, explanation: string): AptQuestion => ({ id, cat, prompt, options, correct, explanation });

export const APTITUDE_BANK: AptQuestion[] = [
  // ---------------- Quantitative ----------------
  Q('q1', 'Quantitative', 'A 120 m long train passes a pole in 6 seconds. What is its speed in km/h?', ['54', '72', '60', '80'], 1, '120 m / 6 s = 20 m/s. Multiply by 18/5 to convert to km/h: 20 × 3.6 = 72.'),
  Q('q2', 'Quantitative', 'After a 20% discount an item costs ₹800. What was the marked price?', ['₹960', '₹1,000', '₹1,040', '₹1,200'], 1, '80% of marked price = 800, so marked price = 800 / 0.8 = ₹1,000.'),
  Q('q3', 'Quantitative', 'Two numbers are in the ratio 3 : 5 and their sum is 64. What is the larger number?', ['24', '32', '40', '45'], 2, 'Total parts = 8, so one part = 8. Larger number = 5 × 8 = 40.'),
  Q('q4', 'Quantitative', 'A can finish a job in 12 days and B in 24 days. Working together, how many days do they need?', ['6', '8', '9', '18'], 1, 'Combined rate = 1/12 + 1/24 = 3/24 = 1/8 per day, so 8 days.'),
  Q('q5', 'Quantitative', 'What is the simple interest on ₹5,000 at 8% per annum for 3 years?', ['₹1,200', '₹1,000', '₹1,400', '₹1,600'], 0, 'SI = P × R × T / 100 = 5000 × 8 × 3 / 100 = ₹1,200.'),
  Q('q6', 'Quantitative', 'The average of 5 numbers is 20. When one number is removed, the average of the other 4 is 18. Which number was removed?', ['24', '26', '28', '30'], 2, 'Total of 5 = 100; total of 4 = 72. Removed number = 100 − 72 = 28.'),
  Q('q7', 'Quantitative', 'What is 25% of 25% of 400?', ['25', '50', '100', '16'], 0, '25% of 400 = 100; 25% of 100 = 25.'),
  Q('q8', 'Quantitative', 'A boat goes 15 km downstream in 1 hour. At the same speed, how long will it take to go 30 km downstream?', ['1.5 hours', '2 hours', '2.5 hours', '3 hours'], 1, 'Downstream speed = 15 km/h, so 30 km takes 30 / 15 = 2 hours.'),
  Q('q9', 'Quantitative', 'Two fair dice are rolled. What is the probability that the sum is 7?', ['1/6', '1/12', '5/36', '7/36'], 0, 'Six of the 36 outcomes sum to 7 ((1,6),(2,5),(3,4),(4,3),(5,2),(6,1)): 6/36 = 1/6.'),
  Q('q10', 'Quantitative', 'What is the LCM of 12, 18 and 24?', ['36', '48', '72', '144'], 2, '12 = 2²·3, 18 = 2·3², 24 = 2³·3. LCM = 2³ · 3² = 72.'),
  Q('q11', 'Quantitative', 'An item bought for ₹400 is sold for ₹500. What is the profit percentage?', ['20%', '25%', '30%', '12.5%'], 1, 'Profit = 100 on cost 400, so 100/400 × 100 = 25%.'),
  Q('q12', 'Quantitative', 'What is the compound interest on ₹10,000 at 10% per annum for 2 years?', ['₹2,000', '₹2,100', '₹2,200', '₹2,310'], 1, 'Amount = 10000 × 1.1² = 12,100, so CI = ₹2,100.'),
  Q('q13', 'Quantitative', 'If x + 1/x = 3, what is x² + 1/x²?', ['5', '7', '9', '11'], 1, 'Square both sides: x² + 2 + 1/x² = 9, so x² + 1/x² = 7.'),
  Q('q14', 'Quantitative', 'A car travels at 60 km/h for 2 hours and then at 40 km/h for 3 hours. What is its average speed?', ['48 km/h', '50 km/h', '52 km/h', '45 km/h'], 0, 'Total distance = 120 + 120 = 240 km in 5 hours → 48 km/h.'),
  // ---------------- Logical ----------------
  Q('l1', 'Logical', 'Find the next number: 2, 6, 12, 20, 30, ?', ['40', '42', '44', '36'], 1, 'Differences are 4, 6, 8, 10, so the next is +12: 30 + 12 = 42 (these are n × (n+1)).'),
  Q('l2', 'Logical', 'Find the next number: 3, 6, 12, 24, ?', ['36', '42', '48', '60'], 2, 'Each term is double the previous one: 24 × 2 = 48.'),
  Q('l3', 'Logical', 'Which number does not belong: 8, 27, 64, 100, 125?', ['27', '64', '100', '125'], 2, '8, 27, 64 and 125 are perfect cubes. 100 is not.'),
  Q('l4', 'Logical', 'If CAT is coded as 3120 (using letter positions C=3, A=1, T=20), how is DOG coded?', ['4157', '4167', '4150', '4715'], 0, 'D=4, O=15, G=7, so DOG = 4157.'),
  Q('l5', 'Logical', 'All engineers are graduates. Some graduates are artists. Conclusion: Some engineers are artists. This conclusion is…', ['Definitely true', 'Definitely false', 'Cannot be determined from the statements', 'Contradicted by the first statement'], 2, 'The artists among the graduates might not include any engineers, so it does not necessarily follow.'),
  Q('l6', 'Logical', 'Pointing to a man, Riya says, “He is the son of my mother’s only brother.” How is the man related to Riya?', ['Brother', 'Cousin', 'Uncle', 'Nephew'], 1, 'Her mother’s brother is her maternal uncle, and his son is her cousin.'),
  Q('l7', 'Logical', 'A person walks 5 km north, turns right and walks 3 km, then turns right again and walks 5 km. How far is he from the start?', ['3 km', '5 km', '8 km', '13 km'], 0, 'North 5, east 3, south 5 brings him back level with the start, 3 km to the east.'),
  Q('l8', 'Logical', 'What is the angle between the hour and minute hands of a clock at 3:00?', ['60°', '90°', '120°', '180°'], 1, 'Each hour mark is 30°, and 3 hours × 30° = 90°.'),
  Q('l9', 'Logical', 'If today is Wednesday, what day will it be after 10 days?', ['Friday', 'Saturday', 'Sunday', 'Monday'], 1, '10 mod 7 = 3, and Wednesday + 3 days = Saturday.'),
  Q('l10', 'Logical', 'Book : Reading :: Fork : ?', ['Eating', 'Cooking', 'Kitchen', 'Spoon'], 0, 'A book is used for reading, and a fork is used for eating.'),
  Q('l11', 'Logical', 'Find the next letter: A, C, F, J, O, ?', ['S', 'T', 'U', 'V'], 2, 'Letter positions are 1, 3, 6, 10, 15. The gaps grow by one, so next is 15 + 6 = 21 = U.'),
  Q('l12', 'Logical', 'In a row of 25 students, Ravi is 10th from the left. What is his position from the right?', ['14th', '15th', '16th', '17th'], 2, 'Position from right = 25 − 10 + 1 = 16.'),
  Q('l13', 'Logical', 'All roses are flowers. No flower is a stone. Conclusion: No rose is a stone.', ['True', 'False', 'Cannot say', 'Only for some roses'], 0, 'Roses are inside flowers, and flowers have nothing in common with stones, so roses are not stones.'),
  // ---------------- Verbal ----------------
  Q('v1', 'Verbal', 'Choose the word closest in meaning to “meticulous”.', ['Careless', 'Precise', 'Hasty', 'Lazy'], 1, 'Meticulous means very careful about details.'),
  Q('v2', 'Verbal', 'Choose the opposite of “scarce”.', ['Rare', 'Limited', 'Abundant', 'Costly'], 2, 'Scarce means in short supply; abundant means plentiful.'),
  Q('v3', 'Verbal', 'Neither of the two answers ___ correct.', ['are', 'is', 'were', 'have been'], 1, '“Neither” takes a singular verb.'),
  Q('v4', 'Verbal', 'She has been working here ___ 2019.', ['for', 'since', 'from', 'by'], 1, '“Since” is used with a starting point in time; “for” is used with a duration.'),
  Q('v5', 'Verbal', 'One word for “a person who loves books”:', ['Bibliophile', 'Philanthropist', 'Misanthrope', 'Egoist'], 0, 'A bibliophile loves and collects books.'),
  Q('v6', 'Verbal', 'What does the idiom “break the ice” mean?', ['Break something cold', 'Start a conversation and ease the tension', 'Feel very cold', 'End a meeting early'], 1, 'It means to make people feel more comfortable at the start of a conversation or event.'),
  Q('v7', 'Verbal', 'Choose the correct form: He ___ know the answer.', ['don’t', 'doesn’t', 'didn’t knew', 'isn’t'], 1, 'With a third-person singular subject, the negative of the present is “doesn’t”.'),
  Q('v8', 'Verbal', 'Which word is spelt correctly?', ['Accomodate', 'Accommodate', 'Acommodate', 'Acomodate'], 1, 'Accommodate has a double c and a double m.'),
  Q('v9', 'Verbal', 'Change to passive voice: “The engineer designed the bridge.”', ['The bridge designed the engineer.', 'The bridge is designed by the engineer.', 'The bridge was designed by the engineer.', 'The bridge has designed by the engineer.'], 2, 'Past simple active becomes “was/were + past participle” in the passive.'),
  Q('v10', 'Verbal', 'Choose the word closest in meaning to “candid”.', ['Frank', 'Secretive', 'Rude', 'Shy'], 0, 'Candid means open and honest, so frank is the nearest.'),
  Q('v11', 'Verbal', 'If I ___ you, I would take the offer.', ['am', 'was', 'were', 'be'], 2, 'Use “were” for an imaginary or unreal condition (subjunctive).'),
  // ---------------- Data Interpretation ----------------
  Q('d1', 'Data Interpretation', 'Monthly sales (units): Jan 120, Feb 150, Mar 180, Apr 210. What is the percentage increase from January to April?', ['60%', '75%', '80%', '90%'], 1, 'Increase = 210 − 120 = 90, and 90/120 × 100 = 75%.'),
  Q('d2', 'Data Interpretation', 'A budget of ₹50,000 is split: 40% rent, 25% food, the rest savings. How much goes to savings?', ['₹15,000', '₹17,500', '₹20,000', '₹12,500'], 1, 'Savings = 100 − 40 − 25 = 35%, and 35% of 50,000 = ₹17,500.'),
  Q('d3', 'Data Interpretation', 'Marks: Maths 80, Physics 70, Chemistry 90, Biology 60. What is the average?', ['70', '72.5', '75', '80'], 2, 'Sum = 300, and 300 / 4 = 75.'),
  Q('d4', 'Data Interpretation', 'Production: Plant A 300 units, B 450 units, C 250 units. What percentage of total production is Plant B?', ['40%', '45%', '50%', '55%'], 1, 'Total = 1,000, so B = 450/1000 = 45%.'),
  Q('d5', 'Data Interpretation', 'Revenue: 2022 = ₹40 lakh, 2023 = ₹50 lakh, 2024 = ₹60 lakh. What is the growth from 2023 to 2024?', ['10%', '20%', '25%', '30%'], 1, 'Increase = 10 on a base of 50, so 20%.'),
  Q('d6', 'Data Interpretation', 'Class A: 45 of 60 students passed. Class B: 40 of 50 passed. Which class has the higher pass rate?', ['Class A', 'Class B', 'Both are equal', 'Cannot be said'], 1, 'A = 75%, B = 80%, so Class B is higher.'),
];

const shuffle = <T,>(a: T[]): T[] => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

/** 15 questions per attempt: 4 quantitative, 4 logical, 4 verbal, 3 data interpretation. */
export function buildAptitudeTest(): AptQuestion[] {
  const take = (c: AptCategory, n: number) => shuffle(APTITUDE_BANK.filter((q) => q.cat === c)).slice(0, n);
  return shuffle([...take('Quantitative', 4), ...take('Logical', 4), ...take('Verbal', 4), ...take('Data Interpretation', 3)]);
}
export const APTITUDE_SIZE = 15;
