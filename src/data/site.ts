export type Visual = "code" | "bars" | "star";

export const profile = {
  name: "Diego Damian",
  role: "Full-Stack Developer",
  location: "Lima, Peru",
  email: "diegodamnze99@gmail.com",
  github: "https://github.com/yellowdrac",
  linkedin: "https://www.linkedin.com/in/diegdamnze",
  // Replace with the real file once added to /public
  cv: "#",
};

export interface Chapter {
  eyebrow: string;
  title: string[];
  text: string;
  visual: Visual;
  tag: string;
}

export const chapters: Chapter[] = [
  {
    eyebrow: "Full-stack developer",
    title: ["I build software,", "front to back."],
    text: "React, .NET, and Node — I design, build, and ship complete products, not just pieces.",
    visual: "code",
    tag: "// build",
  },
];

export const stack = ["React", ".NET", "Node.js", "TypeScript", "SQL"];

export const metrics = [
  { num: "1", label: "Award-winning system" },
  { num: "30+", label: "Production bugs fixed" },
  { num: "12", label: "Features shipped" },
  { num: "5", label: "Apps maintained" },
  { num: "2", label: "Countries (US & Italy)" },
  { num: "3", label: "Products end-to-end" },
];

export const filters = ["All", "React", ".NET", "Node", "Mobile"];

export interface Project {
  name: string;
  short: string;
  award?: boolean;
  desc: string;
  tags: string[];
  /** which filter buckets this project belongs to */
  stacks: string[];
  // --- detail (shown in the modal) ---
  subtitle: string;
  meta: string;
  overview: string;
  features: string[];
  links: { live?: string; code?: string };
}

export const projects: Project[] = [
  {
    name: "AcrediPUCP",
    short: "AcrediPUCP",
    award: true,
    desc: "Management system for university accreditation. Won the internal competition for best system.",
    tags: ["React", "Node", "Express", "MySQL"],
    stacks: ["React", "Node"],
    subtitle: "University accreditation management system",
    meta: "Web · 2023",
    overview:
      "A management system that streamlines the accreditation process for PUCP faculties and programs — replacing scattered spreadsheets and email with one place to handle documents, evidence, and committee review.",
    features: [
      "Document & evidence management for accreditation",
      "Role-based review workflows for faculties and committees",
      "Progress dashboards to track each accreditation",
      "Won the internal best-system competition (professor-judged)",
    ],
    links: { live: "#", code: "#" },
  },
  {
    name: "QARTA",
    short: "QARTA",
    desc: "Social network + online storefront, with payments, rewards, sign-in, and an admin panel.",
    tags: ["React Native", "Next.js", "PostgreSQL", "AWS"],
    stacks: ["React", "Node", "Mobile"],
    subtitle: "Social network + digital storefront",
    meta: "Mobile + Web · 2024",
    overview:
      "Connects customers and partners in one interactive ecosystem — social content, direct messaging, and a shopping experience built for loyalty.",
    features: [
      "Culqi payment gateway integration",
      "Rewards & loyalty system",
      "Auth + role-based access",
      "Partner admin panel + social feed & messaging",
    ],
    links: { live: "#", code: "#" },
  },
  {
    name: "Plaza San Miguel",
    short: "Plaza SM",
    desc: "Shopping-mall app with coupons, store events, and AR games to earn points.",
    tags: ["React Native", "Node", "Unity / C#"],
    stacks: [".NET", "Node", "Mobile"],
    subtitle: "Shopping-mall app with AR games",
    meta: "Mobile + AR · 2023",
    overview:
      "A mobile platform and web admin panel for the Plaza San Miguel mall — coupons, store events, and augmented-reality games where shoppers earn loyalty points.",
    features: [
      "Coupons & store events",
      "Augmented-reality games (Unity) to earn points",
      "Loyalty points system",
      "Web admin panel for mall staff",
    ],
    links: { live: "#", code: "#" },
  },
];
