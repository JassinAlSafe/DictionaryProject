import Dictionary from "./components/Dictionary";
import { ThemeProvider } from "./components/ThemeProvider";
import "./App.css";

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Dictionary />
    </ThemeProvider>
  );
}

export default App;
