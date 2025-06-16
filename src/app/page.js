import Header from "../components/Header.js"; 
import Footer from "../components/Footer.js"; 
import Link from 'next/link';

// Pequeño componente para cada característica, para no repetir código
const FeatureCard = ({ icon, title, children }) => {
    return (
        <div className="bg-gray-800 p-6 rounded-lg text-center transform hover:scale-105 transition-transform duration-300">
            <div className="text-4xl mb-4">{icon}</div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-gray-400">{children}</p>
        </div>
    );
}

export default function Home() {
  return (
    <div className="bg-gray-900 text-white">
      <Header />

      <main>
        {/* Sección Hero */}
        <section className="text-center py-20 px-4 bg-gray-900">
          <h1 className="text-5xl md:text-6xl font-extrabold text-green-400 mb-4 animate-fade-in-down">
            Tu salud financiera y crediticia, en una sola app
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
            Solicitá tu informe Veraz, organizá tu caja y mejorá tu scoring con IA
          </p>
          <Link href="/registro" className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors shadow-lg">
            Empezar Gratis
          </Link>
        </section>

        {/* Sección Problema + Solución */}
        <section className="bg-gray-800 py-16 px-4">
            <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
                <div className="text-center md:text-left">
                    <h2 className="text-4xl font-bold">¿Por qué te rechazan créditos?</h2>
                </div>
                <div className="text-center md:text-left">
                    <p className="text-xl text-green-400 font-semibold">
                        Con Scoring UP sabés al instante tu situación y cómo mejorarla.
                    </p>
                </div>
            </div>
        </section>

        {/* Sección de Características */}
        <section className="py-20 px-4 bg-gray-900">
            <div className="container mx-auto">
                <h2 className="text-4xl font-bold text-center mb-12">Todo lo que necesitas, en un solo lugar</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    <FeatureCard icon="📊" title="Informe Veraz + Asesor IA">
                        Pedí tu informe al instante y deja que nuestra IA te explique qué significa y cómo solucionarlo.
                    </FeatureCard>
                    <FeatureCard icon="💼" title="Billetera Virtual Inteligente">
                        Conecta tus cuentas y ordena tus ingresos y egresos de forma automática para no perder el control.
                    </FeatureCard>
                    <FeatureCard icon="🧾" title="Facturación y Asesoramiento">
                        Ideal para monotributistas y pymes. Factura desde la app y recibe consejos para crecer.
                    </FeatureCard>
                </div>
            </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}