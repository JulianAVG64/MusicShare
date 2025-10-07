import {
  Home,
  Search,
  Compass,
  Radio,
  MessageCircle,
  Bell,
  PlusCircle,
  User,
  Menu,
  Music2,
  Moon,
  Sun,
} from "lucide-react";
import { useState, useEffect } from "react";

type Props = {
  setTheme: (theme: "cupcake" | "dark") => void;
};

export default function IndexLayout({ setTheme }: Props) {
  const [activeItem, setActiveItem] = useState("inicio");
  const [hasNotification, setHasNotification] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<"cupcake" | "dark">(
    "cupcake"
  );

  // Sincronizar con el tema guardado en localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as
      | "cupcake"
      | "dark"
      | null;
    if (savedTheme) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = currentTheme === "dark" ? "cupcake" : "dark";
    setCurrentTheme(newTheme); // Actualiza el estado local para el icono
    setTheme(newTheme); // Actualiza el estado global en App.tsx
  };

  const menuItems = [
    { id: "inicio", icon: Home, label: "Inicio" },
    { id: "buscar", icon: Search, label: "Buscar" },
    { id: "explorar", icon: Compass, label: "Descubrir" },
    { id: "radio", icon: Radio, label: "Radio" },
    {
      id: "mensajes",
      icon: MessageCircle,
      label: "Mensajes",
      notification: true,
    },
    { id: "notificaciones", icon: Bell, label: "Notificaciones" },
    { id: "crear", icon: PlusCircle, label: "Subir Música" },
    { id: "perfil", icon: User, label: "Mi Perfil" },
  ];

  return (
    <div className="flex h-screen bg-base-100">
      {/* Sidebar */}
      <div className="w-72 border-r border-base-300 flex flex-col px-4 py-6 bg-base-200">
        {/* Logo con icono musical */}
        <div className="px-3 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center rotate-12 shadow-lg">
            <Music2
              size={24}
              className="text-primary-content -rotate-12"
              strokeWidth={2.5}
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            MusicShare
          </h1>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveItem(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group ${
                  isActive
                    ? "bg-primary text-primary-content shadow-lg scale-[1.02]"
                    : "hover:bg-base-300 text-base-content"
                }`}
              >
                <div className="relative">
                  <Icon
                    size={24}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`transition-transform ${
                      isActive ? "" : "group-hover:scale-110"
                    }`}
                  />
                  {item.notification && hasNotification && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-error rounded-full flex items-center justify-center text-xs font-bold text-error-content animate-pulse">
                      4
                    </span>
                  )}
                </div>
                <span
                  className={`text-base ${
                    isActive ? "font-bold" : "font-medium"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-base-300 transition-all mb-2 text-base-content"
        >
          {currentTheme === "dark" ? <Sun size={24} /> : <Moon size={24} />}
          <span className="text-base font-medium">
            {currentTheme === "dark" ? "Modo Claro" : "Modo Oscuro"}
          </span>
        </button>

        {/* Más (More) */}
        <button className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-base-300 transition-all text-base-content">
          <Menu size={24} />
          <span className="text-base font-medium">Más opciones</span>
        </button>
      </div>

      {/* Área de contenido */}
      <div className="flex-1 bg-base-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Music2 size={40} className="text-primary" />
          </div>
          <p className="text-base-content/60 text-lg">
            Contenido principal aquí
          </p>
        </div>
      </div>
    </div>
  );
}
