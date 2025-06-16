"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from "firebase/auth";
import { doc, setDoc, onSnapshot, collection, addDoc, query, orderBy } from "firebase/firestore";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../components/AuthContext.js';
import { auth, db } from "../firebase.js";
import ResumenCrediticio from '../../components/ResumenCrediticio.js';

// --- COMPONENTES INTERNOS ---

const MiCuenta = ({ user }) => ( <div className="bg-gray-800 p-6 rounded-lg"><h2 className="text-xl mb-4 font-bold">Tus Datos</h2><p>Email: {user.email}</p>{user.rol && <p>Rol: <strong>{user.rol}</strong></p>}</div>);
const SolicitarInforme = ({ user }) => { const [nombre, setNombre] = useState(""); const [dni, setDni] = useState(""); const handleS = async (e) => { e.preventDefault(); try { await setDoc(doc(db, "solicitudes", user.uid),{nombre,dni,email:user.email,estado:"pendiente_pago",fecha:new Date()}); window.location.href="https://mpago.la/2ADsZ18";} catch(e){console.error(e)} }; return ( <div className="bg-gray-800 p-6 rounded-lg"><h2 className="text-2xl font-bold mb-4">Solicitar Informe</h2><form onSubmit={handleS}><div><label>Nombre</label><input type="text" value={nombre} onChange={(e)=>setNombre(e.target.value)} required className="w-full mt-1 p-2 rounded-lg bg-gray-700"/></div><div><label>DNI</label><input type="number" value={dni} onChange={(e)=>setDni(e.target.value)} required className="w-full mt-1 p-2 rounded-lg bg-gray-700"/></div><button type="submit" className="w-full mt-4 bg-green-600 p-3 rounded-lg font-bold">Pagar</button></form></div> )};

// *** COMPONENTE MisInformes CON EL ANÁLISIS IA RESTAURADO ***
const MisInformes = ({ user }) => {
    const [solicitud, setSolicitud] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, "solicitudes", user.uid), (doc) => {
            setSolicitud(doc.exists() ? { id: doc.id, ...doc.data() } : null);
            setLoading(false);
        });
        return () => unsub();
    }, [user.uid]);
        
    const handleDescargar = async () => { try { const {getStorage,ref,getDownloadURL}=await import("firebase/storage");const storage=getStorage(); const filePath=`informes-pendientes/${user.uid}.pdf`;const fileRef=ref(storage,filePath); const url=await getDownloadURL(fileRef);window.open(url,'_blank')}catch(error){ if(error.code === 'storage/object-not-found'){ alert("Tu informe aún no ha sido procesado.")}else{alert("No se pudo descargar.")}}};

    if (loading) return <div className="bg-gray-800 p-6 rounded-lg text-center"><p>Cargando...</p></div>;

    return (
        <div className="space-y-6">
            <ResumenCrediticio solicitud={solicitud} />

            <div className="bg-gray-800 p-6 rounded-lg">
                <h2 className="text-2xl mb-4 font-bold">Detalle y Acciones</h2>
                {!solicitud ? (
                    <p className="text-gray-400">Todavía no has realizado ninguna solicitud.</p>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-gray-700 p-4 rounded-lg">
                             <p className="text-gray-400 text-sm">Fecha de Solicitud</p>
                             <p>{solicitud.fecha?.toDate().toLocaleDateString('es-AR')}</p>
                             <p className="text-gray-400 text-sm mt-2">Estado</p>
                             <p className="font-bold text-green-400 text-lg">{solicitud.estado}</p>
                        </div>
                        
                        {/* --- ANÁLISIS IA RESTAURADO --- */}
                        {solicitud.resumenIA && (
                            <div className="bg-gray-700 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold mb-2 text-green-300">Análisis del Asesor IA</h3>
                                <p className="text-gray-300 whitespace-pre-wrap">{solicitud.resumenIA}</p>
                            </div>
                        )}
                        {/* ------------------------------- */}

                        {(solicitud.estado === 'Completado' || solicitud.estado === 'informe_enviado') && (
                            <button onClick={handleDescargar} className="w-full mt-2 bg-purple-600 p-3 rounded-lg font-bold">
                                Descargar Informe Original (PDF)
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
// *** FIN DE MisInformes ***


const Billetera = ({ user }) => { /* ... tu código de billetera completo, sin cambios ... */ const [movimientos, setMovimientos] = useState([]); const [descripcion, setDescripcion] = useState(''); const [monto, setMonto] = useState(''); const [tipo, setTipo] = useState('ingreso'); const [categoria, setCategoria] = useState('otros'); useEffect(() => { const q = query(collection(db, 'users', user.uid, 'movimientos'), orderBy('fecha', 'desc')); const unsubscribe = onSnapshot(q, (snapshot) => { setMovimientos(snapshot.docs.map(d=>({...d.data(), id:d.id}))) }); return unsubscribe; }, [user.uid]); const agregarMovimiento = async (e) => { e.preventDefault(); await addDoc(collection(db,'users',user.uid,'movimientos'),{descripcion,monto:tipo==='ingreso'?Number(monto):-Number(monto),tipo,categoria:tipo==='ingreso'?'ingresos':categoria,fecha:new Date()}); setDescripcion(''); setMonto('')}; const { balance, totalIngresos, totalEgresos } = useMemo(() => { const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((acc, curr) => acc + curr.monto, 0); const egresos = movimientos.filter(m => m.tipo === 'egreso').reduce((acc, curr) => acc + curr.monto, 0); return { balance: ingresos + egresos, totalIngresos: ingresos, totalEgresos: -egresos }; }, [movimientos]); return ( <div className="space-y-8"><div className="bg-gray-800 p-6 rounded-lg shadow-lg"><h3 className="text-lg font-semibold text-gray-300 mb-2">Balance General</h3><p className={`text-4xl font-bold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>${balance.toLocaleString('es-AR')}</p><div className="flex justify-between mt-4 text-sm"><div className="text-green-400"><p>Ingresos</p><p>${totalIngresos.toLocaleString('es-AR')}</p></div><div className="text-red-400"><p>Egresos</p><p>${totalEgresos.toLocaleString('es-AR')}</p></div></div></div> <div className="bg-gray-800 p-6 rounded-lg"><h2 className="text-xl font-bold mb-4">Agregar Movimiento</h2><form onSubmit={agregarMovimiento} className="space-y-4"><div><label>Descripción</label><input type="text" value={descripcion} onChange={(e)=>setDescripcion(e.target.value)} required className="w-full mt-1 p-2 bg-gray-700 rounded-lg"/></div><div><label>Monto</label><input type="number" value={monto} onChange={(e)=>setMonto(e.target.value)} required className="w-full mt-1 p-2 bg-gray-700 rounded-lg"/></div><div className="flex items-end gap-4"><div className="flex-1"><label>Tipo</label><div className="flex space-x-2 mt-1"><button type="button" onClick={()=>setTipo('ingreso')} className={`px-4 py-2 text-sm rounded-lg ${tipo==='ingreso'?'bg-green-600':'bg-gray-600'}`}>Ingreso</button><button type="button" onClick={()=>setTipo('egreso')} className={`px-4 py-2 text-sm rounded-lg ${tipo==='egreso'?'bg-red-600':'bg-gray-600'}`}>Egreso</button></div></div>{tipo === 'egreso' && <div className="flex-1"><label>Categoría</label><select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full mt-1 p-2 bg-gray-700 rounded-lg"><option value="vivienda">Vivienda</option><option value="comida">Comida</option><option value="transporte">Transporte</option><option value="servicios">Servicios</option><option value="otros">Otros</option></select></div>}</div><button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold">Agregar</button></form></div><div className="bg-gray-800 p-6 rounded-lg"><h2 className="text-xl font-bold mb-4">Últimos Movimientos</h2><ul className="space-y-2">{movimientos.length > 0 ? movimientos.map(m=><li key={m.id} className="flex justify-between bg-gray-700 p-3 rounded-lg"><span>{m.descripcion}</span><span className={m.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'}>${m.monto.toLocaleString('es-AR')}</span></li>) : <p className="text-gray-500">Aún no hay movimientos registrados.</p>}</ul></div></div>);};
const Educacion = () => { /* tu código sin cambios */ };

export default function PerfilPage() {
    const { user: currentUser, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('billetera');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    useEffect(() => { if (!loading && !currentUser) { router.push('/login'); } }, [currentUser, loading, router]);
    const handleLogout = async () => { await signOut(auth); router.push('/login'); };
    const handleTabChange = (tab) => { setActiveTab(tab); setIsMenuOpen(false); };

    if (loading || !currentUser) { return <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center"><p>Cargando...</p></div>; }

    const MenuNav = () => ( <nav className="flex flex-col space-y-2 p-4"> {currentUser.rol === 'admin' && ( <a href="/admin" className="w-full text-left p-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 font-bold text-center mb-2"> ★ PANEL ADMIN ★ </a> )} <button onClick={() => handleTabChange('billetera')} className={`w-full text-left p-3 rounded-lg ${activeTab === 'billetera' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>Mi Billetera</button> <button onClick={() => handleTabChange('informes')} className={`w-full text-left p-3 rounded-lg ${activeTab === 'informes' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>Mis Informes</button> <button onClick={() => handleTabChange('solicitar')} className={`w-full text-left p-3 rounded-lg ${activeTab === 'solicitar' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>Solicitar</button> <button onClick={() => handleTabChange('cuenta')} className={`w-full text-left p-3 rounded-lg ${activeTab === 'cuenta' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>Mi Cuenta</button> </nav> );

    return ( <div className="min-h-screen bg-gray-900 text-white"> <header className="flex justify-between items-center p-4 bg-gray-800 sticky top-0 z-20"> <h1 className="text-xl font-bold text-green-400">SCORING UP</h1> <button onClick={handleLogout} className="hidden md:block bg-red-600 hover:bg-red-700 py-2 px-3 rounded-lg text-sm font-semibold">Cerrar Sesión</button> <button className="md:hidden p-2 rounded-md hover:bg-gray-700" onClick={() => setIsMenuOpen(!isMenuOpen)}> <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg> </button> </header> {isMenuOpen && <div className="md:hidden bg-gray-800 border-b border-gray-700"><MenuNav /></div>} <div className="flex"> <aside className="hidden md:block w-64 bg-gray-800 shrink-0 h-screen sticky top-[68px]"><MenuNav /></aside> <main className="flex-1 p-4 md:p-8 overflow-y-auto"> {activeTab === 'billetera' && <Billetera user={currentUser} />} {activeTab === 'informes' && <MisInformes user={currentUser} />} {activeTab === 'solicitar' && <SolicitarInforme user={currentUser} />} {activeTab === 'cuenta' && <MiCuenta user={currentUser} />} </main> </div> </div> );
}