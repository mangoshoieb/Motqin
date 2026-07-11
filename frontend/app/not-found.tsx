import { FaGhost } from "react-icons/fa";
import './notfound.css'
export default function NotFound() {
  return (
    <main className="not-found-page">
      <h1 className="not-found-title">
        4
        <span className="not-found-ghost">
          <FaGhost />
        </span>
        4
      </h1>

      <h2 className="not-found-subtitle">
        Error: 404 page not found
      </h2>

      <p className="not-found-description">
        Sorry, the page you're looking for cannot be accessed.
      </p>
    </main>
  );
}