// The ruled header boxes printed at the top of every notebook page: a printed
// caps label over a handwritten-style value, each in its own cell.
export function RuledBoxes({ items }: { items: { label: string; value: React.ReactNode; grow?: number }[] }) {
  return (
    <dl
      className="lk-ruled"
      style={{ gridTemplateColumns: items.map((i) => `minmax(0, ${i.grow ?? 1}fr)`).join(" ") }}
    >
      {items.map((i) => (
        <div key={i.label}>
          <dt>{i.label}</dt>
          <dd>{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}
