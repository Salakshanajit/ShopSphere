// Shows a rating such as 4.5 out of 5 as stars. Shows "New" when there is no rating yet.
export default function Stars({ rating }) {
  const value = Number(rating) || 0;
  if (value <= 0) return <span className="rating rating-new">New</span>;

  const rounded = Math.round(value * 2) / 2;
  return (
    <span className="rating" role="img" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      <span className="stars" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={n <= rounded ? 'star on' : n - 0.5 === rounded ? 'star half' : 'star'}>
            ★
          </span>
        ))}
      </span>
      <span className="rating-number" aria-hidden="true">
        {value.toFixed(1)}
      </span>
    </span>
  );
}
