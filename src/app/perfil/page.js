"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from "firebase/auth";
import { doc, onSnapshot, collection, addDoc, query, orderBy, where, Timestamp } from "firebase/firestore";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../components/AuthContext.js';
import { auth, db } from "../firebase.js";
import ResumenCrediticio from '../../components/ResumenCrediticio.js';
import PredictorScoring from '../../components/PredictorScoring.js';
import LlamadaSaludCrediticia from '../../components/LlamadaSaludCrediticia.js';
import Link from 'next/link';

// === INICIO DE COMPONENTES INTERNOS COMPLETOS ===

const MiCuenta = ({ user }) => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl mb-4 font-bold text-white">Tus Datos de Cuenta</h2>
        <div className="space-y-3">
            <p className="text-gray-400">Email: <span className="text-white font-medium">{user.email}</span></p>
            {user.rol && <p className="text-gray-400 mt-2">Rol: <strong className={`text-white capitalize px-2 py-1 rounded-full text-sm ${user.rol === 'admin' ? 'bg-indigo-500' : 'bg-gray-600'}`}>{user.rol}</strong></p>}
            {user.plan && <p className="text-gray-400 mt-2">Plan: <strong className="text-white capitalize bg-green-600 px-2 py-1 rounded-full text-sm">{user.plan}</strong></p>}
            {user.fechaCreacion && <p className="text-gray-400">Miembro desde: <span className="text-white font-medium">{user.fechaCreacion?.toDate().toLocaleDateString('es-AR')}</span></p>}
        </div>
    </div>
);

const SolicitarInforme = ({ user }) => { 
    const [nombre, setNombre] = useState(""); const [dni, setDni] = useState("");
    const handleS = async (e) => { e.preventDefault(); try { await addDoc(collection(db, "solicitudes"), { userId: user.uid, nombre, dni, email: user.email, estado: "pendiente_pago", fecha: new Date(), tipo: "individual", precio: 6300 }); window.location.href="https://mpago.la/2ADsZ18";} catch(e){console.error("Error al crear solicitud:", e)} }; 
    return (
        <div className="bg-gray-800 p-8 rounded-lg max-w-lg mx-auto">
            <h2 className="text-3xl font-bold mb-2 text-center text-green-400">Solicitar Informe Veraz Premium</h2>
            <p className="text-gray-400 mb-4 text-center">Incluye tu informe completo más el análisis de nuestro Asesor con IA.</p>
            <p className="text-5xl font-extrabold text-white text-center mb-8">$6.300</p>
            <form onSubmit={handleS} className="space-y-4">
                <div><label className="text-sm font-medium text-gray-300">Nombre Completo (como figura en tu DNI)</label><input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="w-full mt-1 p-3 bg-gray-700 rounded-lg"/></div>
                <div><label className="text-sm font-medium text-gray-300">DNI (sin puntos)</label><input type="number" value={dni} onChange={(e) => setDni(e.target.value)} required className="w-full mt-1 p-3 bg-gray-700 rounded-lg"/></div>
                <button type="submit" className="w-full mt-6 bg-green-600 p-3 rounded-lg text-lg font-bold hover:bg-green-700">Pagar y Solicitar</button>
            </form>
        </div>
    );
};

const MisInformes = ({ user }) => {
    const [informes, setInformes] = useState([]); const [informeSeleccionado, setInformeSeleccionado] = useState(null); const [loading, setLoading] = useState(true);
    useEffect(() => { if (!user) return; setLoading(true); const q = query(collection(db, "solicitudes"), where("userId", "==", user.uid), where("tipo", "==", "individual"), orderBy("fecha", "desc")); const unsubscribe = onSnapshot(q, (snapshot) => { const hist = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); setInformes(hist); if (hist.length > 0 && !informes.some(i => i.id === informeSeleccionado?.id)) { setInformeSeleccionado(hist[0]); } setLoading(false); }); return unsubscribe; }, [user]);
    const handleDescargar = async () => { if(!informeSeleccionado?.informeUrl) return; window.open(informeSeleccionado.informeUrl, '_blank');};
    if (loading) { return <div className="text-center p-10 bg-gray-800 rounded-lg">Cargando tu historial...</div>; }
    return (
        <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-1 bg-gray-800 p-4 rounded-lg"><h2 className="text-lg font-bold mb-4 px-2">Tu Historial</h2><ul className="space-y-2">{informes.length > 0 ? (informes.map(informe => (<li key={informe.id}><button onClick={() => setInformeSeleccionado(informe)} className={`w-full text-left p-3 rounded-lg transition-colors ${informeSeleccionado?.id === informe.id ? 'bg-green-600':'bg-gray-700 hover:bg-gray-600'}`}><p className="font-semibold">{informe.fecha.toDate().toLocaleDateString()}</p><p className={`text-xs capitalize ${informe.estado==='informe_enviado'?'text-green-300':'text-yellow-400'}`}>{informe.estado.replace(/_/g,' ')}</p></button></li>))) : <p className="text-sm text-gray-500 px-2">Aún no has solicitado informes.</p>}</ul></div>
            <div className="lg:col-span-2 space-y-6">{!informes.length ? ( <div className="bg-gray-800 p-10 text-center rounded-lg"><h2 className="text-2xl font-bold">Bienvenido a tus Informes</h2><p className="mt-2 text-gray-400">Ve a la pestaña "Solicitar" para obtener tu primer informe.</p></div> ) : informeSeleccionado ? ( <><ResumenCrediticio solicitud={informeSeleccionado} /><div className="bg-gray-800 p-6 rounded-lg"><h2 className="text-2xl mb-4 font-bold">Diagnóstico del Asesor IA</h2>{!informeSeleccionado.analisisIA ? <p className="text-yellow-400">Tu informe está siendo procesado...</p> : (<div className="space-y-4 text-gray-300"><div><p className="text-sm text-gray-400 font-semibold">Resumen:</p><p className="mt-1">{informeSeleccionado.analisisIA.resumenSituacion}</p></div> {informeSeleccionado.analisisIA.alertasCriticas?.length > 0 && (<div className="bg-red-900/40 border border-red-800 p-4 rounded-md"><h3 className="font-semibold text-red-400 mb-2">Alertas Críticas:</h3><ul className="list-disc list-inside space-y-1 text-red-300">{informeSeleccionado.analisisIA.alertasCriticas.map((item, i) => <li key={i}>{item}</li>)}</ul></div>)}{informeSeleccionado.informeUrl && <button onClick={handleDescargar} className="w-full mt-4 bg-purple-600 p-3 rounded-lg font-bold">Descargar PDF Original</button>}</div>)}</div>{informeSeleccionado.analisisIA?.necesitaAyuda && (<LlamadaSaludCrediticia user={user} solicitud={informeSeleccionado} />)}</> ) : <p>Selecciona un informe de tu historial.</p>}</div>
        </div>
    );
};

const Billetera = ({ user, solicitud }) => {
    const [movimientos, setMovimientos] = useState([]); const [descripcion, setDescripcion] = useState(''); const [monto, setMonto] = useState(''); const [tipo, setTipo] = useState('ingreso'); const [categoria, setCategoria] = useState('otros'); const hoy = new Date(); const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0]; const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];
    const [fechaDesde, setFechaDesde] = useState(primerDiaMes); const [fechaHasta, setFechaHasta] = useState(ultimoDiaMes);
    useEffect(() => { if (!user) return; const fDesde = Timestamp.fromDate(new Date(fechaDesde)); const fHasta = Timestamp.fromDate(new Date(fechaHasta+'T23:59:59')); const q = query(collection(db,'users',user.uid,'movimientos'), where('fecha','>=',fDesde), where('fecha','<=',fHasta), orderBy('fecha','desc')); const unsub = onSnapshot(q, (snap) => setMovimientos(snap.docs.map(d => ({...d.data(), id: d.id})))); return unsub; }, [user, fechaDesde, fechaHasta]);
    const agregarMovimiento = async (e) => { e.preventDefault(); await addDoc(collection(db,'users',user.uid,'movimientos'),{descripcion,monto:tipo==='ingreso'?Number(monto):-Number(monto),tipo,categoria,fecha:new Date()}); setDescripcion(''); setMonto(''); };
    const { balance, totalIngresos, totalEgresos, dataGrafico } = useMemo(() => { const ing = movimientos.filter(m => m.tipo === 'ingreso').reduce((a,c)=>a+c.monto,0); const egr = movimientos.filter(m => m.tipo === 'egreso'); const totEgr = egr.reduce((a,c)=>a+Math.abs(c.monto),0); const data = egr.reduce((a,c)=>{a[c.categoria]=(a[c.categoria]||0)+Math.abs(c.monto);return a;},{}); return {balance:ing-totEgr,totalIngresos:ing,totalEgresos:totEgr,dataGrafico:Object.entries(data).map(([name,value])=>({name,value}))}}, [movimientos]);
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF19A3'];
    return (<div className="space-y-8"><PredictorScoring movimientos={movimientos} solicitud={solicitud} /><div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"><div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg shadow-lg"><h3 className="text-lg font-semibold text-gray-300 mb-2">Balance del Período</h3><p className={`text-4xl font-bold ${balance>=0?'text-green-400':'text-red-400'}`}>${balance.toLocaleString('es-AR')}</p><div className="flex justify-between mt-4 text-sm"><div className="text-green-500 flex flex-col"><span>Ingresos</span><strong>${totalIngresos.toLocaleString('es-AR')}</strong></div><div className="text-red-500 flex flex-col text-right"><span>Egresos</span><strong>${totalEgresos.toLocaleString('es-AR')}</strong></div></div></div><div className="md:col-span-1 lg:col-span-2 bg-gray-800 p-6 rounded-lg"><h2 className="text-xl font-bold mb-4 text-center">Distribución de Egresos</h2>{dataGrafico.length > 0 ? <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={dataGrafico} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label={({name,percent})=>(percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : '')}>{dataGrafico.map((entry,index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>)}</Pie><Tooltip formatter={(v) => `$${v.toLocaleString('es-AR')}`}/><Legend/></PieChart></ResponsiveContainer>:<div className="flex items-center justify-center h-[200px] text-gray-500">No hay egresos para mostrar.</div>}</div></div><div className="grid lg:grid-cols-3 gap-6"><div className="lg:col-span-1 bg-gray-800 p-6 rounded-lg"><h2 className="text-xl font-bold mb-4">Filtrar y Agregar</h2><form onSubmit={agregarMovimiento} className="space-y-4"><div><label className="text-sm">Desde</label><input type="date" value={fechaDesde} onChange={e=>setFechaDesde(e.target.value)} className="w-full bg-gray-700 p-2 mt-1 rounded"/></div><div><label className="text-sm">Hasta</label><input type="date" value={fechaHasta} onChange={e=>setFechaHasta(e.target.value)} className="w-full bg-gray-700 p-2 mt-1 rounded"/></div><hr className="border-gray-700"/><div><label>Descripción</label><input type="text" value={descripcion} onChange={e=>setDescripcion(e.target.value)} required className="w-full bg-gray-700 p-2 mt-1 rounded"/></div><div><label>Monto</label><input type="number" value={monto} onChange={e=>setMonto(e.target.value)} required className="w-full bg-gray-700 p-2 mt-1 rounded"/></div><div className="flex items-end gap-4"><div className="flex-1"><label>Tipo</label><div className="flex space-x-2 mt-1"><button type="button" onClick={()=>setTipo('ingreso')} className={`w-full px-4 py-2 text-sm rounded-lg ${tipo==='ingreso'?'bg-green-600':'bg-gray-600'}`}>Ingreso</button><button type="button" onClick={()=>setTipo('egreso')} className={`w-full px-4 py-2 text-sm rounded-lg ${tipo==='egreso'?'bg-red-600':'bg-gray-600'}`}>Egreso</button></div></div>{tipo === 'egreso' && <div className="flex-1"><label>Categoría</label><select value={categoria} onChange={e=>setCategoria(e.target.value)} className="w-full bg-gray-700 p-2.5 mt-1 rounded-lg"><option value="vivienda">Vivienda</option><option value="comida">Comida</option><option value="transporte">Transporte</option><option value="servicios">Servicios</option><option value="tarjeta">Tarjeta</option><option value="otros">Otros</option></select></div>}</div><button type="submit" className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold">Agregar Movimiento</button></form></div><div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg"><h2 className="text-xl font-bold mb-4">Movimientos del Período</h2><ul className="space-y-2 max-h-96 overflow-y-auto">{movimientos.length>0?movimientos.map(m=><li key={m.id} className="flex justify-between items-center bg-gray-700 p-3 rounded-lg"><div><p className="font-medium">{m.descripcion}</p><p className="text-xs text-gray-400 capitalize">{m.categoria} - {m.fecha?.toDate().toLocaleDateString('es-AR')}</p></div><span className={`font-semibold ${m.tipo==='ingreso'?'text-green-400':'text-red-400'}`}>${m.monto.toLocaleString('es-AR')}</span></li>):<p className="text-gray-500">No hay movimientos en este período.</p>}</ul></div></div></div>);
};

const Educacion = () => ( <div>Contenido de Educación</div> );

// ===============================================
// === COMPONENTE PRINCIPAL CON LÓGICA LEVANTADA ===
// ===============================================

export default function PerfilPage() {
    const { user: currentUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('informes');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    // --- ESTADO LEVANTADO ---
    const [informes, setInformes] = useState([]);
    const [informeSeleccionado, setInformeSeleccionado] = useState(null);
    const [historialLoading, setHistorialLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !currentUser) { router.push('/login'); return; }
        if (currentUser) {
            setHistorialLoading(true);
            const q = query(collection(db, "solicitudes"), where("userId", "==", currentUser.uid), where("tipo", "==", "individual"), orderBy("fecha", "desc"));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const informesHistorial = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setInformes(informesHistorial);
                if (informesHistorial.length > 0 && !informes.some(i => i.id === informeSeleccionado?.id)) {
                    setInformeSeleccionado(informesHistorial[0]);
                }
                setHistorialLoading(false);
            });
            return () => unsubscribe();
        }
    }, [currentUser, authLoading]);

    const handleLogout = async () => { await signOut(auth); router.push('/'); };
    const handleTabChange = (tab) => { setActiveTab(tab); setIsMenuOpen(false); };
    const NavButton = ({ tabName, label, isMobile=false}) => { const baseClasses="w-full text-left p-3 rounded-lg font-medium transition-colors"; const desktopClasses="px-3 py-2 text-sm font-medium"; const activeClasses=isMobile ? 'bg-green-600 text-white' : 'text-green-400'; const inactiveClasses=isMobile ? 'hover:bg-gray-700 text-gray-300' : 'text-gray-300 hover:text-white'; return <button onClick={() => handleTabChange(tabName)} className={`${isMobile ? baseClasses : desktopClasses} ${activeTab === tabName ? activeClasses : inactiveClasses}`}>{label}</button>};
    
    if (authLoading || !currentUser) { return <div className="bg-gray-900 min-h-screen flex items-center justify-center"><p>Cargando...</p></div>; }
    
    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            <header className="flex justify-between items-center p-4 bg-gray-800 shadow-md sticky top-0 z-20">
                <Link href="/"><h1 className="text-xl font-bold text-green-400">SCORING UP</h1></Link>
                <div className="hidden md:flex items-center space-x-4">
                    <NavButton tabName="informes" label="Mis Informes" activeTab={activeTab}/>
                    <NavButton tabName="billetera" label="Mi Billetera" activeTab={activeTab}/>
                    <NavButton tabName="solicitar" label="Solicitar" activeTab={activeTab}/>
                    <NavButton tabName="cuenta" label="Mi Cuenta" activeTab={activeTab}/>
                    {currentUser.rol === 'admin' && <Link href="/admin" className="px-3 py-2 text-sm font-bold bg-indigo-600 rounded-md">ADMIN</Link>}
                    <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 py-2 px-3 rounded-lg text-sm">Salir</button>
                </div>
                <button className="md:hidden p-2" onClick={()=>setIsMenuOpen(!isMenuOpen)}>MENU</button>
            </header>
            
            {isMenuOpen && <div className="md:hidden bg-gray-800 border-t border-gray-700">
              <nav className="flex flex-col space-y-2 p-4">{currentUser?.rol==='admin'&&<Link href="/admin" className="w-full text-center p-3 ...">★ PANEL ADMIN ★</Link>}<NavButton tabName="informes" label="Mis Informes" isMobile={true}/><NavButton tabName="billetera" label="Mi Billetera" isMobile={true}/>... </nav>
            </div>}
            
            <div className="flex flex-1">
                <aside className="hidden md:block w-64 bg-gray-800"><nav className="flex flex-col space-y-2 p-4">{currentUser?.rol === 'admin' && (<Link href="/admin" className="...">★ PANEL ADMIN ★</Link>)}<NavButton tabName="informes" label="Mis Informes" activeTab={activeTab} isMobile={true}/><NavButton tabName="billetera" label="Mi Billetera" activeTab={activeTab} isMobile={true}/><NavButton tabName="solicitar" label="Solicitar" activeTab={activeTab} isMobile={true}/><NavButton tabName="cuenta" label="Mi Cuenta" activeTab={activeTab} isMobile={true}/></nav></aside>
                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {activeTab === 'informes' && <MisInformes user={currentUser} informes={informes} informeSeleccionado={informeSeleccionado} onSelectInforme={setInformeSeleccionado} loading={historialLoading} />}
                    {activeTab === 'billetera' && <Billetera user={currentUser} solicitud={informeSeleccionado}/>}
                    {activeTab === 'solicitar' && <SolicitarInforme user={currentUser}/>}
                    {activeTab === 'cuenta' && <MiCuenta user={currentUser}/>}
                    {activeTab === 'educacion' && <Educacion/>}
                </main>
            </div>
        </div>
    );
}