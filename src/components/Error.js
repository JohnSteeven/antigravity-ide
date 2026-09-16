import {Link, useRouteError} from 'react-router'

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

      <Link to="/" className="error-btn" role="button">
        Go Back Home
      </Link>
    </div>
  );
};

export default Error;
