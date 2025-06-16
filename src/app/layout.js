import "./globals.css";
// RUTA CORRECTA A LA NUEVA UBICACIÓN
import { AuthProvider } from "../components/AuthContext.js"; 

export const metadata = {
  title: "Scoring UP",
  description: "Tu salud financiera y crediticia, en una sola app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}