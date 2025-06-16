// src/app/perfil/page.js
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from "firebase/auth";
import { collection, doc, addDoc, onSnapshot, setDoc, orderBy, query } from "firebase/firestore";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { useAuth } from '../../components/AuthContext.js'; // Importamos el contexto central
import { auth, db } from '../firebase.js'; // Importamos las herramientas de Firebase

// --- TUS COMPONENTES INTERNOS (Los he adaptado ligeramente para usar el nuevo 'user' del contexto) ---

// Añadí el rol para mostrarlo y también el UID
const MiCuenta = ({ user }) => ( 
    <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl mb-4 font-bold">Tus Datos</h2>
        <p className="text-gray-400">UID: <span className="text-white">{user.uid}</span></p>
        <p className="text-gray-400">Email: <span className="text-white">{user.email}</span></p>
        <p className="text-gray-400">Plan: <span className="text-white">{user.plan}</span></p>
        <p className="text-gray-400">Rol: <span className="text-white font-bold">{user.rol}</span></p>
    </div>
);
const SolicitarInforme = ({ user }) => { const [nombre, setNombre] = useState(""); const [dni, setDni] = useState(""); const handleS = async (e) => { e.preventDefault(); try { await setDoc(doc(db, "solicitudes", user.uid),{nombre,dni,email:user.email,estado:"pendiente_pago",fecha:new Date()}); window.location.href="https://mpago.la/2ADsZ18";} catch(e){console.error(e)} }; return ( <div className="bg-gray-800 p-6 rounded-lg"><h2 className="text-2xl font-bold mb-4">Solicitar Informe Veraz</h2><p className="mb-4 text-gray-300">Completa tus datos para continuar con el pago seguro a través de Mercado Pago. Costo: $6.300 ARS.</p><form onSubmit={handleS} className="space-y-4"><div><label className="block mb-1">Nombre Completo</label><input type="text" value={nombre} onChange={(e)=>setNombre(e.target.value)} required className="w-full mt-1 p-2 rounded-lg bg-gray-700 border border-gray-600 focus:ring-green-500 focus:border-green-500"/></div><div><label className="block mb-1">DNI (sin puntos)</label><input type="number" value={dni} onChange={(e)=>setDni(e.target.value)} required className="w-full mt-1 p-2 rounded-lg bg-gray-700 border border-gray-600 focus:ring-green-500 focus:border-green-500"/></div><button type="submit" className="w-full mt-4 bg-green-600 p-3 rounded-lg font-bold hover:bg-green-700 transition-colors">Pagar y Solicitar</button></form></div> )};
const MisInformes = ({ user }) => { const [solicitud, setS] = useState(null); useEffect(() => {const unsub = onSnapshot(doc(db,"solicitudes",user.uid), (doc) => { if(doc.exists()) setS(doc.data())}); return unsub},[user.uid]); return ( <div className="bg-gray-800 p-6 rounded-lg"><h2 className="text-2xl mb-4 font-bold">Estado de tu Última Solicitud</h2>{solicitud ? <div><p className="text-gray-400">Fecha de Solicitud: <span className="text-white">{solicitud.fecha && new Date(solicitud.fecha.seconds*1000).toLocaleDateString()}</span></p><p className="text-gray-400">Estado: <span className="font-bold text-lg text-green-400">{solicitud.estado}</span></p></div> : <p className="text-gray-400">Todavía no has realizado ninguna solicitud de informe.</p>}</div>)};
const Educacion = () => { const cats = [{n:'Deudas', l:[{t:'Cómo leer tu Informe Veraz'}]},{n:'Ahorro',l:[{t:'El método 50/30/20 para organizar tus finanzas'}]}]; return(<div className="bg-gray-800 p-6 rounded-lg"><h2 className="text-2xl mb-4 font-bold">Educación Financiera</h2>{cats.map(c=><div key={c.n}><h3 className="text-lg mt-4 font-bold text-green-400">{c.n}</h3><ul>{c.l.map(l=><li key={l.t} className="p-3 bg-gray-700 mt-2 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer" onClick={()=>alert("Contenido disponible próximamente.")}>{l.t}</li>)}</ul></div>)}</div>)};
const Billetera = ({ user }) => { const [movimientos, setMovimientos] = useState([]); const [descripcion, setDescripcion] = useState(''); const [monto, setMonto] = useState(''); const [tipo, setTipo] = useState('ingreso'); const [categoria, setCategoria] = useState('otros'); useEffect(() => { const q = query(collection(db, 'users', user.uid, 'movimientos'), orderBy('fecha', 'desc')); const unsubscribe = onSnapshot(q, (snapshot) => { setMovimientos(snapshot.docs.map(d=>({...d.data(), id:d.id}))) }); return unsubscribe; }, [user.uid]); const agregarMovimiento = async (e) => { e.preventDefault(); await addDoc(collection(db,'users',user.uid,'movimientos'),{descripcion,monto:tipo==='ingreso'?Number(monto):-Number(monto),tipo,categoria:tipo==='ingreso'?'ingresos':categoria,fecha:new Date()}); setDescripcion(''); setMonto('')}; const { balance, dataGrafico } = useMemo(() => { const i=movimientos.filter(m=>m.tipo==='ingreso').reduce((a,c)=>a+c.monto,0); const e=movimientos.filter(m=>m.tipo==='egreso').reduce((a,c)=>a+c.monto,0); const data=Object.entries(movimientos.filter(m=>m.tipo==='egreso').reduce((a,c)=>{const cat=c.categoria||'otros';a[cat]=(a[cat]||0)+-c.monto;return a;},{})).map(([name,value])=>({name,value})); return { balance:i+e,dataGrafico:data}}, [movimientos]); const COLORS=['#0088FE','#00C49F','#FFBB28','#FF8042','#AF19FF']; return ( <div className="space-y-8"><div className="bg-gray-800 p-6 rounded-lg h-96"><h3 className="font-bold mb-4">Distribución de Egresos</h3>{dataGrafico.length > 0 ? <ResponsiveContainer width="100%" height="90%"><PieChart><Pie data={dataGrafico} dataKey="value" nameKey="name" label><Cell key={`c-0`} fill={COLORS[0]}/><Cell key={`c-1`} fill={COLORS[1]}/><Cell key={`c-2`} fill={COLORS[2]}/><Cell key={`c-3`} fill={COLORS[3]}/></Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer>:<p className="text-gray-500">Aún no tienes egresos para mostrar.</p>}</div><div className="bg-gray-800 p-6 rounded-lg"><h2 className="text-xl font-bold mb-4">Agregar Movimiento</h2><form onSubmit={agregarMovimiento} className="space-y-4"><div><label>Descripción</label><input type="text" value={descripcion} onChange={(e)=>setDescripcion(e.target.value)} required className="w-full mt-1 p-2 bg-gray-700 rounded-lg"/></div><div><label>Monto</label><input type="number" value={monto} onChange={(e)=>setMonto(e.target.value)} required className="w-full mt-1 p-2 bg-gray-700 rounded-lg"/></div><div className="flex items-end gap-4"> <div className="flex-1"> <label>Tipo</label><div className="flex space-x-2 mt-1"><button type="button" onClick={()=>setTipo('ingreso')} className={`px-4 py-2 text-sm rounded-lg ${tipo==='ingreso'?'bg-green-600':'bg-gray-600'}`}>Ingreso</button><button type="button" onClick={()=>setTipo('egreso')} className={`px-4 py-2 text-sm rounded-lg ${tipo==='egreso'?'bg-red-600':'bg-gray-600'}`}>Egreso</button></div></div>{tipo === 'egreso' && <div className="flex-1"><label>Categoría</label><select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full mt-1 p-2 bg-gray-700 rounded-lg"><option value="vivienda">Vivienda</option><option value="comida">Comida</option><option value="transporte">Transporte</option><option value="servicios">Servicios</option><option value="otros">Otros</option></select></div>}</div> <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold">Agregar</button></form></div><div className="bg-gray-800 p-6 rounded-lg"><h2 className="text-xl font-bold mb-4">Últimos Movimientos</h2><ul className="space-y-2">{movimientos.map(m=><li key={m.id} className="flex justify-between bg-gray-700 p-3 rounded-lg"><span>{m.descripcion}</span><span className={m.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'}>${m.monto.toLocaleString('es-AR')}</span></li>)}</ul></div></div>);};

// --- COMPONENTE PRINCIPAL (Simplificado con el Contexto) ---
export default function PerfilPage() {
    // Obtenemos el usuario y el estado de carga desde nuestro contexto central
    const { user: currentUser, loading } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState('billetera');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    // El hook `useAuth` ahora maneja la redirección, así que este useEffect ya no es necesario
    // Pero lo dejamos como una segunda capa de seguridad.
    useEffect(() => {
        if (!loading && !currentUser) {
            router.push('/login');
        }
    }, [currentUser, loading, router]);
    
    const handleLogout = async () => { 
        await signOut(auth);
        // El contexto se encargará de detectar el cambio y las páginas se protegerán solas
        // Pero forzamos la redirección para una mejor experiencia de usuario.
        router.push('/login'); 
    };
    
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setIsMenuOpen(false); // Cierra el menú al seleccionar una opción
    };

    // Mostramos un mensaje de carga mientras el contexto verifica la sesión
    if (loading || !currentUser) {
        return (
            <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">
                <p>Cargando perfil...</p>
            </div>
        );
    }

    // El Menú de Navegación ahora puede mostrar el link de Admin si el rol es correcto
    const MenuNav = ({ user }) => (
        <nav className="flex flex-col space-y-2 p-4">
             {user && user.rol === 'admin' && (
                <a href="/admin" className="w-full text-left p-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 font-bold text-center">
                    ★ PANEL ADMIN ★
                </a>
            )}
            <button onClick={() => handleTabChange('billetera')} className={`w-full text-left p-3 rounded-lg ${activeTab === 'billetera' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>Mi Billetera</button>
            <button onClick={() => handleTabChange('educacion')} className={`w-full text-left p-3 rounded-lg ${activeTab === 'educacion' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>Educación</button>
            <button onClick={() => handleTabChange('informes')} className={`w-full text-left p-3 rounded-lg ${activeTab === 'informes' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>Mis Informes</button>
            <button onClick={() => handleTabChange('solicitar')} className={`w-full text-left p-3 rounded-lg ${activeTab === 'solicitar' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>Solicitar</button>
            <button onClick={() => handleTabChange('cuenta')} className={`w-full text-left p-3 rounded-lg ${activeTab === 'cuenta' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>Mi Cuenta</button>
        </nav>
    );

    // Renderizamos la página principal con los datos del usuario logueado
    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <header className="flex justify-between items-center p-4 bg-gray-800 sticky top-0 z-20">
                <h1 className="text-xl font-bold text-green-400">SCORING UP</h1>
                <button onClick={handleLogout} className="hidden md:block bg-red-600 hover:bg-red-700 py-2 px-3 rounded-lg text-sm font-semibold">Cerrar Sesión</button>
                <button className="md:hidden p-2 rounded-md hover:bg-gray-700" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                </button>
            </header>
            
            {isMenuOpen && <div className="md:hidden bg-gray-800 border-b border-gray-700"><MenuNav user={currentUser} /></div>}

            <div className="flex">
                <aside className="hidden md:block w-64 bg-gray-800 shrink-0 h-screen sticky top-[68px]"><MenuNav user={currentUser} /></aside>
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