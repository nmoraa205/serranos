import React from "react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-orange-100 to-pink-100 flex flex-col items-center p-6">
      <header className="w-full max-w-5xl text-center py-8">
        <h1 className="text-4xl font-extrabold text-orange-600">¡Bienvenido a Tacos Serrano!</h1>
        <p className="text-lg text-gray-800 mt-2">Donde cada bocado es una fiesta 🎉</p>
      </header>

      <section className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-6 mb-8">
        <h2 className="text-2xl font-semibold text-orange-500 mb-4">🌮 Nuestro Menú</h2>
        <ul className="space-y-2">
          <li className="flex justify-between border-b pb-2">
            <span>Wrap Mostaza Miel</span>
            <span className="font-bold">₡1500</span>
          </li>
          <li className="flex justify-between border-b pb-2">
            <span>Wrap BBQ</span>
            <span className="font-bold">₡1500</span>
          </li>
          <li className="flex justify-between border-b pb-2">
            <span>Crunchy King Burger</span>
            <span className="font-bold">₡3500</span>
          </li>
        </ul>
      </section>

      <section className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-6 mb-8">
        <h2 className="text-2xl font-semibold text-orange-500 mb-4">📸 Galería</h2>
        <div className="grid grid-cols-2 gap-4">
          <img src="/images/taco1.jpg" alt="Taco delicioso" className="rounded-xl shadow-sm" />
          <img src="/images/burger1.jpg" alt="Hamburguesa Crunchy King" className="rounded-xl shadow-sm" />
        </div>
      </section>

      <section className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-6 mb-8">
        <h2 className="text-2xl font-semibold text-orange-500 mb-4">📍 Dónde Estamos</h2>
        <p className="text-gray-800">Diagonal a la Cruz Roja, Ciudad Quesada</p>
      </section>

      <section className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-6 text-center mb-8">
        <h2 className="text-2xl font-semibold text-orange-500 mb-4">📲 Hacé tu pedido</h2>
        <p className="mb-4">Escribinos por WhatsApp y prepará tu antojo</p>
        <a href="https://wa.me/50624610007" target="_blank" rel="noopener noreferrer" className="inline-block bg-green-500 hover:bg-green-600 text-white text-lg px-6 py-2 rounded-full">
          Pedir por WhatsApp
        </a>
      </section>

      <section className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-6 text-center mb-8">
        <h2 className="text-2xl font-semibold text-orange-500 mb-4">🎵 Jingle de Bienvenida</h2>
        <audio controls className="mx-auto">
          <source src="/audio/jingle-serrano.mp3" type="audio/mpeg" />
          Tu navegador no soporta la reproducción de audio.
        </audio>
      </section>

      <footer className="text-center text-sm text-gray-600 mt-10">
        © 2025 Tacos Serrano. Con sabor y corazón 💛
      </footer>
    </div>
  );
}