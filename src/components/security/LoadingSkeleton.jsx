import "./LoadingSkeleton.css";

const LoadingSkeleton = ({ count = 3 }) => {
  return (
    <div style={{ display: "grid", gap: "12px", width: "100%" }}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="sec-skeleton-box">
          <div className="sec-skeleton-line short" />
          <div className="sec-skeleton-line medium" />
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
