import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MailInput from "../components/Inputs/MailInput";
import PasswordInput from "../components/Inputs/PasswordInput";
import Toast from "../components/Toast";
import { apiFetch } from "../lib/api"; // 👈 importa tu api.tsx
import { setToken } from "../lib/auth"; // 👈 importa el helper de auth

type Props = {
  theme: "cupcake" | "dark";
};

export default function Login({ theme }: Props) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  }>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8002/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username: email,
          password: password,
        }),
      });

      
      const data = await res.json();

    if (res.ok && data.access_token) {
      console.log("✅ Login exitoso:", data);
      setToken(data.access_token); // 👈 guarda token usando auth.tsx
      setToast({ message: "Inicio de sesión exitoso", type: "success" });
      navigate("/"); // redirige al home
    } else {
      console.error("Error en el login:", data);
      setToast({
        message: data.detail || "Credenciales incorrectas",
        type: "error",
      });
    }
  } catch (err: any) {
    console.error("❌ Error al iniciar sesión:", err);
    setToast({ message: "No se pudo conectar con el servidor", type: "error" });
  } finally {
    setIsLoading(false);
  }
  };

  return (
    <div className="bg-base-300 select-none min-h-screen" data-theme={theme}>
      {toast && (
        <Toast message={toast.message} id={Date.now()} type={toast.type} />
      )}
      <section className="w-full min-h-screen flex items-center justify-center bg-no-repeat bg-center">
        <div className="bg-base-100 rounded-3xl shadow-xl flex w-full max-w-5xl overflow-hidden">
          <div className="w-full md:w-1/2 p-10">
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-bold mb-2 text-base-content">
                Iniciar sesión
              </h2>
              <p className="text-sm opacity-70">Accede a tu cuenta musical</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <MailInput onChange={setEmail} />
              <PasswordInput onChange={setPassword} />
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="checkbox checkbox-sm checkbox-warning"
                  />
                  <label
                    htmlFor="remember"
                    className="cursor-pointer opacity-80"
                  >
                    Recordarme
                  </label>
                </div>
                <a
                  href="/forgot-password"
                  className="text-warning hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <div className="flex items-center justify-start gap-2 text-sm">
                <span className="opacity-80">¿No tienes una cuenta?</span>
                <a
                  href="/signup"
                  className="text-warning hover:underline font-medium"
                >
                  Regístrate aquí
                </a>
              </div>
              <button
                type="submit"
                className="btn btn-warning w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </button>
            </form>
          </div>
          <div
            className="hidden md:block md:w-1/2 bg-cover bg-center"
            style={{ backgroundImage: `url(/static/signup.jpeg)` }}
            role="img"
            aria-label="Imagen de fondo para login"
          />
        </div>
      </section>
    </div>
  );
}
