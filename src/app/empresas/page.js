import Header from '../../components/Header.js';
import Footer from '../../components/Footer.js';

const PlanCard = ({ plan, informes, precio, precioUnitario, destacado = false }) => (
    <div className={`border-2 ${destacado ? 'border-green-500' : 'border-gray-700'} rounded-lg p-6 flex flex-col`}>
        <h3 className="text-2xl font-bold text-center">{plan}</h3>
        {destacado && <p className="text-center text-green-400 font-bold mb-4">Más Popular</p>}
        <p className="text-4xl font-extrabold text-center my-4">{informes}<span className="text-lg font-normal"> Informes</span></p>
        <p className="text-center text-gray-400 mb-2">Precio Total: ${precio.toLocaleString('es-AR')}</p>
        <p className="text-center text-gray-400 mb-6">Equivale a ${precioUnitario.toLocaleString('es-AR')} por informe</p>
        <button className={`mt-auto ${destacado ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-500'} text-white font-bold py-2 px-4 rounded-lg`}>
            Solicitar Paquete
        </button>
    </div>
);


export default function EmpresasPage() {
    return (
        <div className="bg-gray-900 text-white">
            <Header />

            <main className="container mx-auto py-20 px-4">
                <section className="text-center">
                    <h1 className="text-5xl font-extrabold text-green-400">Packs de Informes para Empresas</h1>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto mt-4">
                        Optimiza la evaluación de riesgo de tus clientes con nuestros paquetes B2B. Ideal para inmobiliarias, financieras, agencias, estudios contables y más.
                    </p>
                </section>

                <section className="mt-20">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Aquí replicamos la tabla de precios que definiste */}
                        <PlanCard plan="Starter" informes={10} precio={17000} precioUnitario={1700} />
                        <PlanCard plan="Business" informes={50} precio={80000} precioUnitario={1600} destacado={true} />
                        <PlanCard plan="Corporate" informes={100} precio={150000} precioUnitario={1500} />
                        <PlanCard plan="Enterprise" informes={300} precio={420000} precioUnitario={1400} />
                    </div>
                </section>
                
                <section className="mt-20 max-w-2xl mx-auto bg-gray-800 p-8 rounded-lg">
                    <h2 className="text-3xl font-bold text-center mb-6">Contacta a un Asesor</h2>
                    <form className="space-y-6">
                         <div>
                            <label htmlFor="nombreEmpresa" className="block text-sm font-medium">Nombre de la Empresa</label>
                            <input type="text" id="nombreEmpresa" required className="w-full mt-1 bg-gray-700 p-2 rounded-lg border border-gray-600"/>
                        </div>
                         <div>
                            <label htmlFor="emailEmpresa" className="block text-sm font-medium">Email de Contacto</label>
                            <input type="email" id="emailEmpresa" required className="w-full mt-1 bg-gray-700 p-2 rounded-lg border border-gray-600"/>
                        </div>
                         <div>
                            <label htmlFor="mensaje" className="block text-sm font-medium">Mensaje (opcional)</label>
                            <textarea id="mensaje" rows="4" className="w-full mt-1 bg-gray-700 p-2 rounded-lg border border-gray-600"></textarea>
                        </div>
                        <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold">Enviar Consulta</button>
                    </form>
                </section>

            </main>

            <Footer />
        </div>
    );
}