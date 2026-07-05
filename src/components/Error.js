import {Link, useRouteError} from 'react-router-dom'

const Error = () => {
  const err = useRouteError();

  return (
    <div className="error-page">
      <h1>Oops!</h1>

      <h2>Something went wrong.</h2>

      <p>
        {err?.status} : {err?.statusText}
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
