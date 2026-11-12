export type Review = {
  id: string;
  name: string;
  place: string;
  flag: string;
  role?: string;
  featured?: boolean;
  paragraphs: { text: string; bold?: string[] }[];
  accent?: "sea" | "coral" | "lemon" | "ink";
};

/** Illustrative testimonials for Talkotype marketing pages. */
export const reviews: Review[] = [
  {
    id: "marta",
    name: "Marta Kovalenko",
    place: "Kyiv, Ukraine",
    flag: "🇺🇦",
    role: "Podcast host",
    featured: true,
    accent: "coral",
    paragraphs: [
      {
        text: "I used to spend Sunday nights scrubbing episode notes. Talkotype turned that into a coffee break. I drop the WAV, stretch, and the transcript is already there.",
        bold: ["coffee break", "transcript is already there"],
      },
      {
        text: "Speaker labels on Unlimited are the quiet hero — guests stop blending into one mysterious paragraph.",
        bold: ["Speaker labels"],
      },
    ],
  },
  {
    id: "devon",
    name: "Devon Hale",
    place: "Austin, United States",
    flag: "🇺🇸",
    role: "Founder",
    featured: true,
    accent: "sea",
    paragraphs: [
      {
        text: "We stopped treating meeting notes like a punishment. Upload the Zoom MP4, skim Talkotype, ship the action items before lunch.",
        bold: ["stopped treating meeting notes like a punishment"],
      },
      {
        text: "Free got the team hooked. Unlimited kept us from inventing a spreadsheet cult.",
        bold: ["Free", "Unlimited"],
      },
    ],
  },
  {
    id: "priya",
    name: "Priya Nair",
    place: "London, United Kingdom",
    flag: "🇬🇧",
    role: "Researcher",
    featured: true,
    accent: "lemon",
    paragraphs: [
      {
        text: "Interview hours used to mean typing hours. Talkotype is literally saving me days every month on qualitative work.",
        bold: ["literally saving me days every month"],
      },
      {
        text: "I still clean names and terms — but the first draft is genuinely impressive for mixed accents.",
        bold: ["genuinely impressive"],
      },
    ],
  },
  {
    id: "jonas",
    name: "Jonas Meier",
    place: "Berlin, Germany",
    flag: "🇩🇪",
    role: "YouTube creator",
    featured: true,
    accent: "ink",
    paragraphs: [
      {
        text: "SRT exports from Unlimited are a game-changer for short clips. Transcript first, captions second, edit once.",
        bold: ["game-changer", "SRT exports"],
      },
    ],
  },
  {
    id: "sofia",
    name: "Sofia Alvarez",
    place: "Buenos Aires, Argentina",
    flag: "🇦🇷",
    role: "Student",
    featured: true,
    accent: "coral",
    paragraphs: [
      {
        text: "Lecture recordings used to haunt my Drive. Now I transcribe three a day on Free and actually study the words.",
        bold: ["three a day on Free"],
      },
    ],
  },
  {
    id: "liam",
    name: "Liam O’Connor",
    place: "Dublin, Ireland",
    flag: "🇮🇪",
    role: "Agency producer",
    featured: true,
    accent: "sea",
    paragraphs: [
      {
        text: "Client calls, voice notes, messy WhatsApp audio — Talkotype eats all of it. We finally transcribe everything without thinking about the format.",
        bold: ["transcribe everything without thinking"],
      },
    ],
  },
  {
    id: "hana",
    name: "Hana Sato",
    place: "Osaka, Japan",
    flag: "🇯🇵",
    role: "Language learner",
    paragraphs: [
      {
        text: "I practice with English podcasts and check my ear against the transcript. Talkotype is patient in a way textbooks aren’t.",
        bold: ["check my ear against the transcript"],
      },
    ],
  },
  {
    id: "noah",
    name: "Noah Bright",
    place: "Toronto, Canada",
    flag: "🇨🇦",
    role: "Journalist",
    paragraphs: [
      {
        text: "Long interviews used to mean an all-nighter. Five-hour uploads on Unlimited mean I can chase the quote, not the keyboard.",
        bold: ["Five-hour uploads", "chase the quote"],
      },
      {
        text: "DOCX export drops straight into my edit doc. Tiny thing. Huge mood.",
        bold: ["DOCX export"],
      },
    ],
  },
  {
    id: "elena",
    name: "Elena Petrova",
    place: "Sofia, Bulgaria",
    flag: "🇧🇬",
    role: "Support lead",
    paragraphs: [
      {
        text: "We record onboarding calls and turn them into internal docs the same afternoon. Accuracy on clear calls is extremely high.",
        bold: ["extremely high"],
      },
    ],
  },
  {
    id: "marcus",
    name: "Marcus Webb",
    place: "Cape Town, South Africa",
    flag: "🇿🇦",
    role: "Course builder",
    paragraphs: [
      {
        text: "I talk lesson drafts into my phone, dump the MP3 into Talkotype, and reshape the outline. Speaking is drafting now.",
        bold: ["Speaking is drafting now"],
      },
    ],
  },
  {
    id: "amira",
    name: "Amira Hassan",
    place: "Cairo, Egypt",
    flag: "🇪🇬",
    role: "Community manager",
    paragraphs: [
      {
        text: "Background café noise used to scare me off transcription tools. Talkotype still gets the gist — then I tidy the spicy bits.",
        bold: ["still gets the gist"],
      },
    ],
  },
  {
    id: "theo",
    name: "Theo Blanc",
    place: "Lyon, France",
    flag: "🇫🇷",
    role: "Indie hacker",
    paragraphs: [
      {
        text: "Yearly Unlimited paid for itself the week I stopped hiring rush transcript gigs for demo videos.",
        bold: ["Yearly Unlimited paid for itself"],
      },
    ],
  },
  {
    id: "ravi",
    name: "Ravi Desai",
    place: "Bengaluru, India",
    flag: "🇮🇳",
    role: "Product manager",
    paragraphs: [
      {
        text: "Standups, customer calls, random Loom dumps — Talkotype is the shared brain we pretend we have.",
        bold: ["shared brain"],
      },
      {
        text: "Priority on Unlimited is noticeable when the whole team uploads after a big kickoff.",
        bold: ["Priority on Unlimited"],
      },
    ],
  },
  {
    id: "claire",
    name: "Claire Nguyen",
    place: "Melbourne, Australia",
    flag: "🇦🇺",
    role: "Therapist (notes practice)",
    paragraphs: [
      {
        text: "With consent and careful workflow, dictating reflections and turning them into text saves me evenings. Privacy controls + delete anytime matter.",
        bold: ["delete anytime matter"],
      },
    ],
  },
  {
    id: "owen",
    name: "Owen Park",
    place: "Seoul, South Korea",
    flag: "🇰🇷",
    role: "Film student",
    paragraphs: [
      {
        text: "I upload interview MOVs, grab the transcript, then pull SRT for rough cuts. Talkotype sits nicely between shoot day and edit day.",
        bold: ["between shoot day and edit day"],
      },
    ],
  },
];

export const featuredReviews = reviews.filter((review) => review.featured);
