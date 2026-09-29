export type PortfolioProject = {
  slot: number;
  id: string;
  brand: string;
  title: string;
  line: string;
  tag: string;
  detail: string;
  image: string;
  color: string;
  backword: string;
  scope: string[];
  liveUrl: string;
};

export const DEFAULT_PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    slot: 1,
    id: "architecture",
    brand: "CEE BEE",
    title: "Cee Bee Interiors",
    line: "Premium interior design studio website concept focused on luxury spaces and refined presentation.",
    tag: "Interior Design",
    detail: "A premium interior design studio concept built around immersive spaces, refined typography, and a clear route to project enquiries.",
    image: "/images/projects/cee-bee.webp",
    color: "#2a1d16",
    backword: "Spaces.",
    scope: ["Luxury visual direction", "Responsive project showcase", "Project enquiry experience"],
    liveUrl: "https://suraj-portfolio-phi-six.vercel.app/ceebee/index.html",
  },
  {
    slot: 2,
    id: "designer",
    brand: "Homelane",
    title: "Home lane interior designer",
    line: "This is the website of an interior designing company which does interior designing work and this website has been created to showcase their booking system and their work.",
    tag: "Designing",
    detail: "This website is made to represent their proper work and their hard work by making sure that the whole process and their work is showcased which makes their entire work even better.",
    image: "/api/cms-image/legacy-wedding",
    color: "#211c1a",
    backword: "Interiors.",
    scope: ["Editorial story telling", "Interior designing and showcase", "Availability enquiry flow"],
    liveUrl: "https://teamshadow.ai.studio/",
  },
  {
    slot: 3,
    id: "coffee",
    brand: "PARMANAND",
    title: "Parmanand Sweets",
    line: "Premium mithai and gifting website concept built for festive ordering and brand presentation.",
    tag: "Sweets & Gifting",
    detail: "A premium sweets and gifting storefront concept that presents signature products, celebration collections, and clear ordering actions.",
    image: "/images/projects/parmanand.webp",
    color: "#4b1712",
    backword: "Tradition.",
    scope: ["Premium product presentation", "Festive gifting collections", "Mobile-first ordering journey"],
    liveUrl: "https://parmanand-sweets.ai.studio/",
  },
  {
    slot: 4,
    id: "skincare",
    brand: "RC WEDDINGS",
    title: "RC Weddings Films",
    line: "Cinematic wedding portfolio concept for wedding films, collections, and booking enquiries.",
    tag: "Wedding Photography",
    detail: "A cinematic wedding portfolio concept for RC Weddings Films with strong visual hierarchy, selected collections, and a focused booking journey.",
    image: "/images/projects/rc-weddings.webp",
    color: "#24100d",
    backword: "Cinematic.",
    scope: ["Cinematic art direction", "Wedding portfolio collections", "Shoot booking journey"],
    liveUrl: "https://rc-weddings-films.ai.studio/",
  },
];

export function getDefaultProject(slot: number) {
  return DEFAULT_PORTFOLIO_PROJECTS.find((project) => project.slot === slot);
}
