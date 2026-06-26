export function Background() {
  return (
    <div className="ambient" aria-hidden="true">
      <div className="ambient__color ambient__color--primary" />
      <div className="ambient__color ambient__color--secondary" />
      <div className="ambient__cloud ambient__cloud--near" />
      <div className="ambient__cloud ambient__cloud--far" />
      <div className="ambient__grid" />
      <div className="ambient__traces" />
    </div>
  );
}
