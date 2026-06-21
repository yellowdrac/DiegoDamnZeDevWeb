import { useTheme } from "./hooks/useTheme";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Content from "./components/Content";

export default function App() {
  const { theme, toggle } = useTheme();
  return (
    <>
      <Nav theme={theme} onToggle={toggle} />
      <Hero />
      <Content />
    </>
  );
}
