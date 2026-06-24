import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Content from "./components/Content";
import ProgressRail from "./components/ProgressRail";
import { useAccent } from "./hooks/useAccent";

export default function App() {
  const { accent, setAccent } = useAccent();
  return (
    <>
      <Nav accent={accent} onAccent={setAccent} />
      <Hero accent={accent} />
      <Content />
      <ProgressRail />
    </>
  );
}
