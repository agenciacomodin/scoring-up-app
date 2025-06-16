export default function Footer() {
    return (
        <footer className="bg-gray-800 text-white py-8">
            <div className="container mx-auto px-6 text-center">
                <p>© 2025 Scoring UP. Todos los derechos reservados.</p>
                <div className="flex justify-center space-x-4 mt-4">
                    <a href="#" className="hover:text-green-400">Términos y Condiciones</a>
                    <a href="#" className="hover:text-green-400">Política de Privacidad</a>
                </div>
            </div>
        </footer>
    );
}