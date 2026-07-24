export default function Avatar({ name = '', src }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <span className="avatar" aria-hidden="true">
      {src ? <img src={src} alt="" /> : initial}
    </span>
  );
}
