// The account's face: its profile photo, or the first letter of its name on a
// cream label when there's none.
export function Avatar({ name, image, size = 22 }: { name: string; image?: string | null; size?: number }) {
  const box = size === 22 ? undefined : { width: size, height: size, fontSize: Math.round(size * 0.5) };
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" width={size} height={size} className="lk-avatar lk-avatar-photo" style={box} />;
  }
  return (
    <span className="lk-avatar" style={box} aria-hidden>
      {name.charAt(0)}
    </span>
  );
}
