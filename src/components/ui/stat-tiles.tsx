type Tile = { label: string; value: React.ReactNode; unit?: string };

type Props = {
  tiles: Tile[];
};

/** A row of small headline numbers. When a single number is the message, a tile beats a chart. */
export function StatTiles({ tiles }: Props) {
  return (
    <dl className="grid gap-2" style={{ gridTemplateColumns: `repeat(${tiles.length}, minmax(0, 1fr))` }}>
      {tiles.map((tile) => (
        <div key={tile.label} className="ios-list flex flex-col gap-0.5 px-3.5 py-3">
          <dt className="text-[13px] text-muted">{tile.label}</dt>
          <dd className="flex items-baseline gap-1">
            <span className="text-[28px] leading-none font-bold tracking-tight tabular">{tile.value}</span>
            {tile.unit && <span className="text-[13px] text-muted">{tile.unit}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
