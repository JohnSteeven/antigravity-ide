import {Link, useRouteError} from 'react-router-dom'

const Error = () => {
  const err = useRouteError();
  const status = err?.status || err?.statusCode;
  const message =
    err?.statusText ||
    err?.message ||
    (typeof err === "string" ? err : "") ||
    "Something went wrong";

  return (
    <div className="error-page">
      <h1>Oops!</h1>

      <h2>Something went wrong.</h2>

      <p>
        {status ? `${status}: ${message}` : message}
      </p>

      <Link to="/">
        <button className="error-btn">
          Go Back Home
        </button>
      </Link>
    </div>
  );
};

export default Error;
