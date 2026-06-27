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

/** Tech stack pills — proper nouns, identical in every language. */
export const stack = ["React", ".NET", "Node.js", "TypeScript", "SQL"];

/** Sentinel key for the "show everything" filter (label comes from i18n). */
export const FILTER_ALL = "All";

/** Work filter buckets (tech names — not translated). */
export const FILTER_KEYS = ["React", ".NET", "Node", "Mobile"];

export interface Project {
  id: string;
  name: string;
  short: string;
  award?: boolean;
  tags: string[];
  /** which filter buckets this project belongs to */
  stacks: string[];
  links: { live?: string; code?: string };
  // --- translatable text (merged in from i18n at runtime) ---
  desc: string;
  subtitle: string;
  meta: string;
  overview: string;
  features: string[];
}

/** Stable, language-independent project data. Translatable text lives in i18n. */
export interface ProjectBase {
  id: string;
  name: string;
  short: string;
  award?: boolean;
  tags: string[];
  stacks: string[];
  links: { live?: string; code?: string };
}

export const projectsBase: ProjectBase[] = [
  {
    id: "acredipucp",
    name: "AcrediPUCP",
    short: "AcrediPUCP",
    award: true,
    tags: ["React", "Node", "Express", "MySQL"],
    stacks: ["React", "Node"],
    links: { live: "#", code: "#" },
  },
  {
    id: "qarta",
    name: "QARTA",
    short: "QARTA",
    tags: ["React Native", "Next.js", "PostgreSQL", "AWS"],
    stacks: ["React", "Node", "Mobile"],
    links: { live: "#", code: "#" },
  },
  {
    id: "plaza",
    name: "Plaza San Miguel",
    short: "Plaza SM",
    tags: ["React Native", "Node", "Unity / C#"],
    stacks: [".NET", "Node", "Mobile"],
    links: { live: "#", code: "#" },
  },
];
