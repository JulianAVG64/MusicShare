import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignUp from "./Page/SignUp";
import Login from "./Page/Login";
import MainLayout from "./layout/MainLayout";
import IndexLayout from "./layout/IndexLayout";
import ExampleProfile from "./components/ExampleProfile";
function App() {
  const [theme, setTheme] = useState<"cupcake" | "dark">("cupcake");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as
      | "cupcake"
      | "dark"
      | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, [setTheme]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div data-theme={theme}>
      <BrowserRouter>
        <Routes>
          <Route path="/signup" element={<SignUp theme={theme} />} />
          <Route path="/login" element={<Login theme={theme} />} />
          <Route path="/" element={<MainLayout setTheme={setTheme} />}>
            <Route element={<IndexLayout setTheme={setTheme} />}>
              <Route index element={<> {/* index: no hijo, IndexLayout mostrará su contenido por defecto */} </>} />
              <Route path="perfil" element={<ExampleProfile />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
