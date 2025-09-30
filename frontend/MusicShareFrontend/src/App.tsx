import { useState } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import SignUp from "./components/SingUp"

function App() {
  const [theme, setTheme] = useState("light")

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "cupcake")
  }

  return (
    <div data-theme={theme} className="min-h-screen bg-base-200">
      <BrowserRouter>
        <Routes>
          <Route path="/singup" element={<SignUp />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App