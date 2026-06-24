import { profile } from "../data/site";

export default function Nav() {
  return (
    <nav>
      <div className="logo">
        DIEGO <b>DAMIAN</b>
      </div>
      <div className="navright">
        <a className="cv" href={profile.cv}>
          Download CV
        </a>
      </div>
    </nav>
  );
}
