import { useState } from "react";
import MailInput from "./Inputs/MailInput";
import PasswordInput from "./Inputs/PasswordInput";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log(email,password)
  };

  return (
    <div className="bg-base-200 select-none">
      <section className="w-full min-h-[calc(100vh)] flex items-center justify-center overflow-hidden">
        <div className="bg-white rounded-3xl shadow-xl flex w-full max-w-5xl overflow-hidden">
          <div className="w-full md:w-1/2 p-10 text-gray-800">
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-bold mb-2">Crear cuenta</h2>
              <p className="text-sm text-gray-500">
                Únete a nuestra comunidad musical
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <MailInput value={email} onChange={setEmail} />
              <PasswordInput value={password} onChange={setPassword} />
              <div className="flex items-center justify-start gap-2 text-sm text-gray-600">
                <span>¿Ya tienes una cuenta?</span>
                <a href="/login" className="text-orange-400 hover:underline">
                  Inicia sesión aquí
                </a>
              </div>

              <button type="submit" className="btn btn-warning w-full ">
                Crear Cuenta
              </button>

              {errorMsg && (
                <p className="text-red-600 text-sm text-center mt-2">
                  {errorMsg}
                </p>
              )}
            </form>
          </div>
          <div
            className={`hidden md:block md:w-1/2 bg-contain bg-center`}
            style={{ backgroundImage: `url(/static/signup.jpeg)` }}
            role="img"
          />
        </div>
      </section>
    </div>
  );
}
