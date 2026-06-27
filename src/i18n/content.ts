export type Lang = "en" | "es";

export interface ProjectText {
  desc: string;
  subtitle: string;
  meta: string;
  overview: string;
  features: string[];
}

export interface Content {
  nav: { cv: string };
  hero: { eyebrow: string; title: string[]; text: string; tag: string };
  intro: {
    highlightLabel: string;
    hlText: string;
    hlSub: string;
    vizTitle: string;
    before: string;
    after: string;
  };
  metrics: { num: string; label: string }[];
  work: { head: string; sub: string; all: string; award: string };
  contact: { title: string; sub: string };
  scrollcue: string;
  ui: { close: string; whatIBuilt: string; viewLive: string; viewCode: string; focus: string; showText: string };
  projects: Record<string, ProjectText>;
}

export const content: Record<Lang, Content> = {
  en: {
    nav: { cv: "Download CV" },
    hero: {
      eyebrow: "Full-stack developer",
      title: ["I build software,", "front to back."],
      text: "React, .NET, and Node — I design, build, and ship complete products, not just pieces.",
      tag: "// build",
    },
    intro: {
      highlightLabel: "★ Career highlight",
      hlText:
        "I turned an academic research paper into a working production algorithm that reduced material waste in a factory.",
      hlSub: "Real, measured impact on the plant floor — not a side project.",
      vizTitle: "Material waste — production line",
      before: "Before",
      after: "After",
    },
    metrics: [
      { num: "1", label: "Award-winning system" },
      { num: "30+", label: "Production bugs fixed" },
      { num: "12", label: "Features shipped" },
      { num: "5", label: "Apps maintained" },
      { num: "2", label: "Countries (US & Italy)" },
      { num: "3", label: "Products end-to-end" },
    ],
    work: {
      head: "Selected Work",
      sub: "Three products I designed, built, and shipped. Click any for details.",
      all: "All",
      award: "★ Award-winning",
    },
    contact: {
      title: "Let's work together.",
      sub: "Open to full-stack roles · Remote-friendly · Based in {location}",
    },
    scrollcue: "Scroll to explore",
    ui: {
      close: "Close",
      whatIBuilt: "What I built",
      viewLive: "View live ↗",
      viewCode: "View code",
      focus: "Focus",
      showText: "Show text",
    },
    projects: {
      acredipucp: {
        desc: "Management system for university accreditation. Won the internal competition for best system.",
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
      },
      qarta: {
        desc: "Social network + online storefront, with payments, rewards, sign-in, and an admin panel.",
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
      },
      plaza: {
        desc: "Shopping-mall app with coupons, store events, and AR games to earn points.",
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
      },
    },
  },

  es: {
    nav: { cv: "Descargar CV" },
    hero: {
      eyebrow: "Desarrollador full-stack",
      title: ["Construyo software,", "de inicio a fin."],
      text: "React, .NET y Node — diseño, construyo y lanzo productos completos, no solo piezas.",
      tag: "// build",
    },
    intro: {
      highlightLabel: "★ Logro destacado",
      hlText:
        "Convertí un paper de investigación académica en un algoritmo de producción funcional que redujo el desperdicio de material en una fábrica.",
      hlSub: "Impacto real y medido en planta — no un proyecto secundario.",
      vizTitle: "Desperdicio de material — línea de producción",
      before: "Antes",
      after: "Después",
    },
    metrics: [
      { num: "1", label: "Sistema premiado" },
      { num: "30+", label: "Bugs de producción resueltos" },
      { num: "12", label: "Funcionalidades lanzadas" },
      { num: "5", label: "Apps mantenidas" },
      { num: "2", label: "Países (EE. UU. e Italia)" },
      { num: "3", label: "Productos de inicio a fin" },
    ],
    work: {
      head: "Trabajo seleccionado",
      sub: "Tres productos que diseñé, construí y lancé. Haz clic en cualquiera para ver detalles.",
      all: "Todos",
      award: "★ Premiado",
    },
    contact: {
      title: "Trabajemos juntos.",
      sub: "Abierto a roles full-stack · Trabajo remoto · Desde {location}",
    },
    scrollcue: "Desplázate para explorar",
    ui: {
      close: "Cerrar",
      whatIBuilt: "Lo que construí",
      viewLive: "Ver en vivo ↗",
      viewCode: "Ver código",
      focus: "Enfocar",
      showText: "Ver texto",
    },
    projects: {
      acredipucp: {
        desc: "Sistema de gestión para la acreditación universitaria. Ganó la competencia interna al mejor sistema.",
        subtitle: "Sistema de gestión de acreditación universitaria",
        meta: "Web · 2023",
        overview:
          "Un sistema de gestión que agiliza el proceso de acreditación para las facultades y programas de la PUCP — reemplazando hojas de cálculo y correos dispersos por un solo lugar para manejar documentos, evidencias y la revisión del comité.",
        features: [
          "Gestión de documentos y evidencias para la acreditación",
          "Flujos de revisión por roles para facultades y comités",
          "Tableros de progreso para seguir cada acreditación",
          "Ganó la competencia interna al mejor sistema (evaluado por profesores)",
        ],
      },
      qarta: {
        desc: "Red social + tienda online, con pagos, recompensas, inicio de sesión y panel de administración.",
        subtitle: "Red social + tienda digital",
        meta: "Móvil + Web · 2024",
        overview:
          "Conecta a clientes y socios en un solo ecosistema interactivo — contenido social, mensajería directa y una experiencia de compra pensada para la fidelización.",
        features: [
          "Integración de la pasarela de pagos Culqi",
          "Sistema de recompensas y fidelización",
          "Autenticación + acceso por roles",
          "Panel de administración para socios + feed social y mensajería",
        ],
      },
      plaza: {
        desc: "App de centro comercial con cupones, eventos de tiendas y juegos AR para ganar puntos.",
        subtitle: "App de centro comercial con juegos AR",
        meta: "Móvil + AR · 2023",
        overview:
          "Una plataforma móvil y panel web para el centro comercial Plaza San Miguel — cupones, eventos de tiendas y juegos de realidad aumentada donde los compradores ganan puntos de fidelidad.",
        features: [
          "Cupones y eventos de tiendas",
          "Juegos de realidad aumentada (Unity) para ganar puntos",
          "Sistema de puntos de fidelidad",
          "Panel de administración web para el personal del centro",
        ],
      },
    },
  },
};
