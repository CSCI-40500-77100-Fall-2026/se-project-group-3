const MAX_STARS = 10;

export default function StarRating({ value, className = "" }) {
  return (
    <span className={`star-rating-row ${className}`} aria-label={`${value.toFixed(2)} star difficulty`}>
      {Array.from({ length: MAX_STARS }, (_, i) => {
        const fraction = Math.min(1, Math.max(0, value - i));
        return (
          <span className="star" key={i}>
            <span className="star__empty">★</span>
            {fraction > 0 && (
              <span
                className="star__filled"
                style={{ clipPath: `inset(0 ${100 - fraction * 100}% 0 0)` }}
              >
                ★
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
