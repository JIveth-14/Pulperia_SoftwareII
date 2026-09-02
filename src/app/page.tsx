import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        <div className="text-2xl font-bold text-indigo-600">Pulpería</div>
        <Link
          href="/login"
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          Inicia sesión
        </Link>
      </nav>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-6">
        <div className="text-center max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Gestiona tu Pulpería
            <span className="text-indigo-600"> con facilidad</span>
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            Software todo-en-uno para administrar clientes, inventario, fiados y ventas.
            La solución perfecta para tu negocio.
          </p>

          <Link
            href="/login"
            className="inline-block px-8 py-4 bg-indigo-600 text-white text-lg font-semibold rounded-lg hover:bg-indigo-700 transition shadow-lg"
          >
            Comenzar ahora
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-5xl w-full">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="text-3xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Gestión de Clientes</h3>
            <p className="text-gray-600">Registra y controla tus clientes, fiados y historial de pagos.</p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="text-3xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Inventario</h3>
            <p className="text-gray-600">Controla tu stock, alertas de productos bajos y organiza tu inventario.</p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="text-3xl mb-4">💰</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Ventas</h3>
            <p className="text-gray-600">Registra ventas, genera reportes y analiza tu desempeño.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-600 border-t border-gray-200">
        <p>&copy; 2024 Pulpería. Todos los derechos reservados.</p>
      </footer>
    </main>
  );
}
