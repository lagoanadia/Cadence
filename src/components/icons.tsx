import {
  Activity,
  Baby,
  Bath,
  Bed,
  Bike,
  BookOpen,
  Brain,
  Briefcase,
  Brush,
  Bus,
  Camera,
  Car,
  Code,
  Coffee,
  CookingPot,
  Droplets,
  Dumbbell,
  Film,
  Flower2,
  Footprints,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  Heart,
  House,
  Languages,
  Leaf,
  type LucideIcon,
  Moon,
  Mountain,
  Music,
  Package,
  Palette,
  PawPrint,
  PenLine,
  Pill,
  Plane,
  Receipt,
  Scissors,
  ShoppingBag,
  ShoppingCart,
  Shirt,
  Smartphone,
  Sparkles,
  SprayCan,
  Sprout,
  Star,
  Sun,
  Sunrise,
  Target,
  Ticket,
  Trash2,
  Users,
  Utensils,
  Wallet,
  WashingMachine,
  Waves,
  Wine,
  Wrench,
} from "lucide-react";

// The database stores an icon as a plain string ("book-open"). This map turns
// that string into a real component. Only keys listed here are accepted by the
// forms, so the database can never contain an icon we can't draw.
export const ICONS = {
  // General / areas
  activity: Activity,
  "book-open": BookOpen,
  brain: Brain,
  briefcase: Briefcase,
  camera: Camera,
  code: Code,
  "graduation-cap": GraduationCap,
  heart: Heart,
  house: House,
  languages: Languages,
  leaf: Leaf,
  music: Music,
  palette: Palette,
  pen: PenLine,
  sparkles: Sparkles,
  sprout: Sprout,
  star: Star,
  sun: Sun,
  sunrise: Sunrise,
  moon: Moon,
  target: Target,
  users: Users,
  wallet: Wallet,
  // Money
  utensils: Utensils,
  coffee: Coffee,
  "shopping-cart": ShoppingCart,
  "shopping-bag": ShoppingBag,
  bus: Bus,
  car: Car,
  fuel: Fuel,
  plane: Plane,
  film: Film,
  ticket: Ticket,
  gamepad: Gamepad2,
  wine: Wine,
  shirt: Shirt,
  gift: Gift,
  pill: Pill,
  smartphone: Smartphone,
  receipt: Receipt,
  paw: PawPrint,
  baby: Baby,
  package: Package,
  // Home
  "washing-machine": WashingMachine,
  "spray-can": SprayCan,
  brush: Brush,
  bath: Bath,
  bed: Bed,
  trash: Trash2,
  droplets: Droplets,
  "cooking-pot": CookingPot,
  flower: Flower2,
  wrench: Wrench,
  scissors: Scissors,
  // Movement
  dumbbell: Dumbbell,
  footprints: Footprints,
  bike: Bike,
  waves: Waves,
  mountain: Mountain,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export const ICON_NAMES = Object.keys(ICONS) as IconName[];

export function isIconName(value: string): value is IconName {
  return value in ICONS;
}

type Props = {
  name: string | null;
  className?: string;
};

/** Draws an icon stored as a string. Unknown names fall back to a star. */
export function Icon({ name, className }: Props) {
  const Component = name && isIconName(name) ? ICONS[name] : Star;
  return <Component className={className} aria-hidden />;
}
