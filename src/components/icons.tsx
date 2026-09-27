import {
  Activity,
  Bike,
  BookOpen,
  Brain,
  Briefcase,
  Camera,
  Code,
  Coffee,
  Dumbbell,
  Flower2,
  Footprints,
  Gamepad2,
  GraduationCap,
  Heart,
  House,
  Languages,
  Leaf,
  type LucideIcon,
  Music,
  Palette,
  PenLine,
  Plane,
  Sparkles,
  Sprout,
  Star,
  Sun,
  Sunrise,
  Target,
  Users,
  Utensils,
  Wallet,
} from "lucide-react";

// The database stores an icon as a plain string ("book-open"). This map turns
// that string into a real component. Only keys listed here are accepted by the
// forms, so the database can never contain an icon we can't draw.
export const ICONS = {
  activity: Activity,
  bike: Bike,
  "book-open": BookOpen,
  brain: Brain,
  briefcase: Briefcase,
  camera: Camera,
  code: Code,
  coffee: Coffee,
  dumbbell: Dumbbell,
  flower: Flower2,
  footprints: Footprints,
  gamepad: Gamepad2,
  "graduation-cap": GraduationCap,
  heart: Heart,
  house: House,
  languages: Languages,
  leaf: Leaf,
  music: Music,
  palette: Palette,
  pen: PenLine,
  plane: Plane,
  sparkles: Sparkles,
  sprout: Sprout,
  star: Star,
  sun: Sun,
  sunrise: Sunrise,
  target: Target,
  users: Users,
  utensils: Utensils,
  wallet: Wallet,
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
