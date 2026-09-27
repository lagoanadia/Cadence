type Props = {
  hidden: boolean;
  children: React.ReactNode;
  /** What to show instead. Dots by default. */
  placeholder?: string;
};

/**
 * Private mode: hides numbers and names so the screen can be shown to others
 * (e.g. in a portfolio demo). When hidden, the real value is NOT sent to the
 * browser at all — it's not just made invisible with CSS.
 */
export function Private({ hidden, children, placeholder = "•••" }: Props) {
  if (!hidden) return <>{children}</>;
  return (
    <span aria-label="Hidden" className="tracking-widest text-muted">
      {placeholder}
    </span>
  );
}
