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

// [-- NUEVO --] Definimos un tipo para la estructura de una notificación
interface Notification {
  type: string;
  message: string;
  from_user?: string;
}

export default function IndexLayout({ setTheme }: Props) {
  const [activeItem, setActiveItem] = useState("inicio");
  // [-- MODIFICADO --] Cambiamos el estado para almacenar una lista de notificaciones
  const [notifications, setNotifications] = useState<Notification[]>([]);
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

  // [-- NUEVO --] useEffect para gestionar la conexión WebSocket
  useEffect(() => {
    // ⚠️ ¡Importante! Este ID debe ser dinámico, basado en el usuario que ha iniciado sesión.
    // Por ahora, usamos un valor fijo para la prueba.
    const userId = "user123"; 
    const wsUrl = `ws://localhost:8082/ws/${userId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket conectado exitosamente.");
    };

    ws.onmessage = (event) => {
      console.log("Notificación recibida:", event.data);
      const newNotification = JSON.parse(event.data);
      // Añadimos la nueva notificación a la lista existente
      setNotifications((prevNotifications) => [...prevNotifications, newNotification]);
    };

    ws.onclose = () => {
      console.log("WebSocket desconectado.");
    };

    ws.onerror = (error) => {
      console.error("Error en WebSocket:", error);
    };

    // Función de limpieza: se ejecuta cuando el componente se desmonta
    return () => {
      ws.close();
    };
  }, []); // El array vacío asegura que este efecto se ejecute solo una vez

  const toggleTheme = () => {
    const newTheme = currentTheme === "dark" ? "cupcake" : "dark";
    setCurrentTheme(newTheme);
    setTheme(newTheme);
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
      notification: true, // Esto es para el ícono de mensajes
    },
    { id: "notificaciones", icon: Bell, label: "Notificaciones" },
    { id: "crear", icon: PlusCircle, label: "Subir Música" },
    { id: "perfil", icon: User, label: "Mi Perfil" },
  ];
  
  // [-- MODIFICADO --] Ahora el ícono de mensajes usa la longitud del array de notificaciones
  const unreadMessagesCount = notifications.length;

  return (
    <div className="flex h-screen bg-base-100">
      {/* Sidebar */}
      <div className="w-72 border-r border-base-300 flex flex-col px-4 py-6 bg-base-200">
        {/* Logo... (sin cambios) */}
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
                onClick={() => {
                  setActiveItem(item.id);
                  // Limpiar notificaciones si se hace clic en el ítem de mensajes
                  if (item.id === 'mensajes') {
                    setNotifications([]);
                  }
                }}
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
                  {/* [-- MODIFICADO --] La lógica ahora depende del contador de notificaciones */}
                  {item.notification && unreadMessagesCount > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-error rounded-full flex items-center justify-center text-xs font-bold text-error-content animate-pulse">
                      {unreadMessagesCount}
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
        
        {/* Theme Toggle y Más... (sin cambios) */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-base-300 transition-all mb-2 text-base-content"
        >
          {currentTheme === "dark" ? <Sun size={24} /> : <Moon size={24} />}
          <span className="text-base font-medium">
            {currentTheme === "dark" ? "Modo Claro" : "Modo Oscuro"}
          </span>
        </button>

        <button className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-base-300 transition-all text-base-content">
          <Menu size={24} />
          <span className="text-base font-medium">Más opciones</span>
        </button>
      </div>

      {/* Área de contenido... (sin cambios) */}
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