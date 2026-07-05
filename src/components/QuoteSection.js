import { useCms } from "../context/CmsContext";

const QuoteSection = () => {
  const { data } = useCms();
  const quote = data.site.quote;

  return (
    <section
      className="quote-section"
      style={{ backgroundImage: `url("${quote.image}")` }}
    >
      <div className="quote-overlay"></div>

      <div className="quote-content">
        <span className="quote-icon" aria-hidden="true">
          "
        </span>

        <h2 className="quote-text">{quote.text}</h2>

        <p className="quote-author">{quote.author}</p>
        <div className="quote-divider"></div>
      </div>
    </section>
  );
};

export default QuoteSection;
