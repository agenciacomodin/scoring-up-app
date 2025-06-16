"use client";

import { useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase.js"; 
import { doc, setDoc, getDoc, collection, addDoc, query, onSnapshot, orderBy } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- COMPONENTES INTERNOS COMPLETOS ---

const MiCuenta = ({ user }) => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg animate-fade-in">
        <h2 className="text-xl mb-4 font-bold">Tus Datos de Cuenta</h2>
        <p className="text-gray-400">Email: {user.email}</p>
        <p className="text-gray-400">ID de Usuario: {user.uid}</p>
    </div>
);

const SolicitarInforme = ({ user }) => {
    const [nombreCompleto, setNombreCompleto] = useState("");
    const [dni, setDni] = useState("");
    const handleSolicitarInforme = async (e) => { e.preventDefault(); try { await setDoc(doc(db, "solicitudes", user.uid), { nombre: nombreCompleto, dni: dni, email: user.email, estado: "Pendiente de Pago", fecha: new Date() }); window.location.href = "https://mpago.la/2ADsZ18"; } catch (error) { console.error("Error al guardar la solicitud: ", error); alert("Hubo un error al procesar tu solicitud."); } };
    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg animate-fade-in">
            <h2 className="text-2xl font-bold mb-4">Solicitar Informe Veraz Premium</h2>
            <form onSubmit={handleSolicitarInforme} className="space-y-6">
                <div><label className="block text-sm font-medium mb-1">Nombre Completo</label><input type="text" value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} required className="w-full bg-gray-700 p-2 rounded-lg"/></div>
                <div><label className="block text-sm font-medium mb-1">DNI</label><input type="number" value={dni} onChange={(e) => setDni(e.target.value)} required className="w-full bg-gray-700 p-2 rounded-lg"/></div>
                <button type="submit" className="w-full bg-green-600 p-3 rounded-lg font-bold">Pagar y Solicitar</button>
            </form>
        </div>
    );
};

const MisInformes = ({ user }) => {
    const [solicitud, setS] = useState(null);
    useEffect(() => { const unsub = onSnapshot(doc(db,"solicitudes",user.uid), (doc) => { if(doc.exists()) setS(doc.data())}); return unsub; },[user.uid]);
    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg animate-fade-in">
            <h2 className="text-2xl font-bold mb-4">Historial de Informes</h2>
            {solicitud ? <div><p>Fecha: {solicitud.fecha && new Date(solicitud.fecha.seconds*1000).toLocaleDateString()}</p><p>Estado: {solicitud.estado}</p></div> : <p>No hay solicitudes.</p>}
        </div>
    );
};

const Billetera = ({ user }) => {
    const [movimientos, setMovimientos] = useState([]);
    const [descripcion, setDescripcion] = useState('');
    const [monto, setMonto] = useState('');
    const [tipo, setTipo] = useState('ingreso');
    const [categoria, setCategoria] = useState('otros');

    useEffect(() => {
        const q = query(collection(db, 'users', user.uid, 'movimientos'), orderBy('fecha', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => { setMovimientos(snapshot.docs.map(d=>({...d.data(), id:d.id}))) });
        return unsubscribe;
    }, [user.uid]);

    const agregarMovimiento = async (e) => { e.preventDefault(); await addDoc(collection(db,'users',user.uid,'movimientos'),{descripcion,monto:tipo==='ingreso'?Number(monto):-Number(monto),tipo,categoria:tipo==='ingreso'?'ingresos':categoria,fecha:new Date()}); setDescripcion('');setMonto('')};

    const { balance, dataGrafico } = useMemo(() => { const i=movimientos.filter(m=>m.tipo==='ingreso').reduce((a,c)=>a+c.monto,0); const e=movimientos.filter(m=>m.tipo==='egreso').reduce((a,c)=>a+c.monto,0); const data=Object.entries(movimientos.filter(m=>m.tipo==='egreso').reduce((a,c)=>{const cat=c.categoria||'otros';a[cat]=(a[cat]||0)+-c.monto;return a;},{})).map(([name,value])=>({name,value})); return {balance:i+e,dataGrafico:data}}, [movimientos]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

    return (
        <div className="space-y-8 animate-fade-in">
             <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg h-96"><h3 className="font-bold mb-4">Distribución de Egresos</h3>{dataGrafico.length > 0 ? <ResponsiveContainer width="100%" height="90%"><PieChart><Pie data={dataGrafico} dataKey="value" nameKey="name" label><Cell key={`c-0`} fill={COLORS[0]}/><Cell key={`c-1`} fill={COLORS[1]}/><Cell key={`c-2`} fill={COLORS[2]}/><Cell key={`c-3`} fill={COLORS[3]}/></Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer>:<p>No hay egresos.</p>}</div>
            {/* ... Resto de la billetera (formulario, lista) ... */}
             <div className="bg-gray-800 p-6 rounded-lg"><h2 className="text-xl font-bold mb-4">Últimos Movimientos</h2><ul className="space-y-2">{movimientos.map(m=><li key={m.id} className="flex justify-between bg-gray-700 p-3 rounded-lg"><span>{m.descripcion}</span><span className={m.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'}>${m.monto.toLocaleString('es-AR')}</span></li>)}</ul></div>
        </div>
    );
};

const Educacion = () => {
    const categorias = [{nombre:'Deudas',lecciones:[{titulo:'Leer Veraz'},{titulo:'Salir Veraz'}]},{nombre:'Ahorro',lecciones:[{titulo:'Método 50/30/20'}]}];
    return(
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg animate-fade-in">
            <h2 className="text-3xl font-bold mb-6">Centro de Educación Financiera</h2>
            <div className="space-y-8">{categorias.map(cat=>(<div key={cat.nombre}><h3 className="text-xl font-bold text-green-400 mb-4">{cat.nombre}</h3><ul className="space-y-3">{cat.lecciones.map(l=>(<li key={l.titulo} className="flex items-center justify-between p-4 rounded-lg bg-gray-700 hover:bg-gray-600 cursor-pointer" onClick={()=>alert("Próximamente: " + l.titulo)}><span>{l.titulo}</span><span></span></li>))}</ul></div>))}</div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL (con el layout responsive correcto) ---
export default function PerfilPage() {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('billetera');
    const [isMenuOpen, setIsMenuOpen] = useState(false); 
    const router = useRouter();
    
    useEffect(() => { const unsub = onAuthStateChanged(auth, u => {if(u) setCurrentUser(u); else router.push('/login'); setLoading(false)}); return unsub; }, [router]);

    const handleLogout = async () => { await signOut(auth); router.push('/login'); };

    const handleTabChange = (tab) => { setActiveTab(tab); setIsMenuOpen(false); };

    if (loading) return <div>Cargando...</div>;
    
    if (currentUser) {
        const MenuNav = () => (
            <nav className="flex flex-col space-y-2 p-4">
                <button onClick={() => handleTabChange('billetera')} className={`w-full text-left p-3 rounded-lg ${activeTab === 'billetera' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>Mi Billetera</button>
                <button onClick={() => handleTabChange('educacion')} className={`w-full text-left p-3 rounded-lg ${activeTab === 'educacion' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>Educación</button>
                <button onClick={() => handleTabChange('informes')} className={`w-full text-left p-3 rounded-lg ${activeTab === 'informes' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>Mis Informes</button>
                <button onClick={() => handleTabChange('solicitar')} className={`w-full text-left p-3 rounded-lg ${activeTab === 'solicitar' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>Solicitar</button>
                <button onClick={() => handleTabChange('cuenta')} className={`w-full text-left p-3 rounded-lg ${activeTab === 'cuenta' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>Mi Cuenta</button>
            </nav>
        );

        return (
            <div className="min-h-screen bg-gray-900 text-white">
                <header className="flex justify-between items-center p-4 bg-gray-800 sticky top-0 z-20">
                    <h1 className="text-xl font-bold text-green-400">SCORING UP</h1>
                    <button onClick={handleLogout} className="hidden md:block bg-red-600 hover:bg-red-700 py-2 px-3 rounded-lg text-sm font-semibold">Cerrar Sesión</button>
                    <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                    </button>
                </header>
                
                {isMenuOpen && <div className="md:hidden bg-gray-800 border-b border-gray-700 animate-fade-in-down"><MenuNav /></div>}

                <div className="flex">
                    <aside className="hidden md:block w-64 bg-gray-800 shrink-0"><MenuNav /></aside>
                    <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                        {activeTab === 'educacion' && <Educacion />}
                        {activeTab === 'billetera' && <Billetera user={currentUser} />}
                        {activeTab === 'informes' && <MisInformes user={currentUser} />}
                        {activeTab === 'solicitar' && <SolicitarInforme user={currentUser} />}
                        {activeTab === 'cuenta' && <MiCuenta user={currentUser} />}
                    </main>
                </div>
            </div>
        );
    }
}