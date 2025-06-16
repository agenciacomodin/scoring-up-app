"use client";

import { useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase.js"; 
import { doc, setDoc, getDoc, collection, addDoc, query, onSnapshot, orderBy } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- COMPONENTES COMPLETOS ---

const MiCuenta = ({ user }) => ( <div className="bg-gray-800 p-6 rounded-lg"><h2 className="text-xl mb-4 font-bold">Tus Datos</h2><p>Email: {user.email}</p></div>);
const SolicitarInforme = ({ user }) => { const [nombre, setNombre] = useState(""); const [dni, setDni] = useState(""); const handleS = async (e) => { e.preventDefault(); try { await setDoc(doc(db, "solicitudes", user.uid),{nombre,dni,email:user.email,estado:"Pendiente",fecha:new Date()}); window.location.href="https://mpago.la/2ADsZ18";} catch(e){console.error(e)} }; return ( <div className="bg-gray-800 p-6 rounded-lg"><h2 className="text-2xl font-bold mb-4">Solicitar Informe</h2><form onSubmit={handleS}><div><label>Nombre</label><input type="text" value={nombre} onChange={(e)=>setNombre(e.target.value)} required className="w-full mt-1 p-2 rounded-lg bg-gray-700"/></div><div><label>DNI</label><input type="number" value={dni} onChange={(e)=>setDni(e.target.value)} required className="w-full mt-1 p-2 rounded-lg bg-gray-700"/></div><button type="submit" className="w-full mt-4 bg-green-600 p-3 rounded-lg font-bold">Pagar</button></form></div> )};
const MisInformes = ({ user }) => { const [solicitud, setS] = useState(null); useEffect(() => {const unsub = onSnapshot(doc(db,"solicitudes",user.uid), (doc) => { if(doc.exists()) setS(doc.data())}); return unsub},[user.uid]); return ( <div className="bg-gray-800 p-6 rounded-lg"><h2 className="text-2xl mb-4">Historial</h2>{solicitud ? <div><p>Fecha: {solicitud.fecha && new Date(solicitud.fecha.seconds*1000).toLocaleDateString()}</p><p>Estado: {solicitud.estado}</p></div> : <p>No hay solicitudes.</p>}</div>)};
const Educacion = () => { const cats = [{n:'Deudas', l:[{t:'Leer Veraz'}]},{n:'Ahorro',l:[{t:'Método 50/30/20'}]}]; return(<div className="bg-gray-800 p-6 rounded-lg"><h2 className="text-2xl mb-4">Educación</h2>{cats.map(c=><div key={c.n}><h3 className="text-lg mt-4 font-bold text-green-400">{c.n}</h3><ul>{c.l.map(l=><li key={l.t} className="p-2 bg-gray-700 mt-2 rounded-lg hover:bg-gray-600" onClick={()=>alert("Proximamente...")}>{l.t}</li>)}</ul></div>)}</div>)};


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

    const agregarMovimiento = async (e) => { e.preventDefault(); await addDoc(collection(db,'users',user.uid,'movimientos'),{descripcion,monto:tipo==='ingreso'?Number(monto):-Number(monto),tipo,categoria:tipo==='ingreso'?'ingresos':categoria,fecha:new Date()}); setDescripcion(''); setMonto('')};

    const { balance, dataGrafico } = useMemo(() => { const i=movimientos.filter(m=>m.tipo==='ingreso').reduce((a,c)=>a+c.monto,0); const e=movimientos.filter(m=>m.tipo==='egreso').reduce((a,c)=>a+c.monto,0); const data=Object.entries(movimientos.filter(m=>m.tipo==='egreso').reduce((a,c)=>{const cat=c.categoria||'otros';a[cat]=(a[cat]||0)+-c.monto;return a;},{})).map(([name,value])=>({name,value})); return { balance:i+e,dataGrafico:data}}, [movimientos]);

    const COLORS=['#0088FE','#00C49F','#FFBB28','#FF8042','#AF19FF'];

    return (
        <div className="space-y-8">
            <div className="bg-gray-800 p-6 rounded-lg h-96"><h3 className="font-bold mb-4">Distribución de Egresos</h3>{dataGrafico.length > 0 ? <ResponsiveContainer width="100%" height="90%"><PieChart><Pie data={dataGrafico} dataKey="value" nameKey="name" label><Cell key={`c-0`} fill={COLORS[0]}/><Cell key={`c-1`} fill={COLORS[1]}/><Cell key={`c-2`} fill={COLORS[2]}/><Cell key={`c-3`} fill={COLORS[3]}/></Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer>:<p className="text-gray-500">No hay egresos.</p>}</div>
            {/* *** FORMULARIO DE AGREGAR MOVIMIENTO RESTAURADO *** */}
            <div className="bg-gray-800 p-6 rounded-lg"><h2 className="text-xl font-bold mb-4">Agregar Movimiento</h2><form onSubmit={agregarMovimiento} className="space-y-4"><div><label>Descripción</label><input type="text" value={descripcion} onChange={(e)=>setDescripcion(e.target.value)} required className="w-full mt-1 p-2 bg-gray-700 rounded-lg"/></div><div><label>Monto</label><input type="number" value={monto} onChange={(e)=>setMonto(e.target.value)} required className="w-full mt-1 p-2 bg-gray-700 rounded-lg"/></div><div className="flex items-end gap-4"> <div className="flex-1"> <label>Tipo</label><div className="flex space-x-2 mt-1"><button type="button" onClick={()=>setTipo('ingreso')} className={`px-4 py-2 text-sm rounded-lg ${tipo==='ingreso'?'bg-green-600':'bg-gray-600'}`}>Ingreso</button><button type="button" onClick={()=>setTipo('egreso')} className={`px-4 py-2 text-sm rounded-lg ${tipo==='egreso'?'bg-red-600':'bg-gray-600'}`}>Egreso</button></div></div>{tipo === 'egreso' && <div className="flex-1"><label>Categoría</label><select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full mt-1 p-2 bg-gray-700 rounded-lg"><option value="vivienda">Vivienda</option><option value="comida">Comida</option><option value="transporte">Transporte</option><option value="servicios">Servicios</option><option value="otros">Otros</option></select></div>}</div> <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold">Agregar</button></form></div>
            <div className="bg-gray-800 p-6 rounded-lg"><h2 className="text-xl font-bold mb-4">Últimos Movimientos</h2><ul className="space-y-2">{movimientos.map(m=><li key={m.id} className="flex justify-between bg-gray-700 p-3 rounded-lg"><span>{m.descripcion}</span><span className={m.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'}>${m.monto.toLocaleString('es-AR')}</span></li>)}</ul></div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL (con el ícono de hamburguesa restaurado) ---
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
                    {/* *** BOTÓN HAMBURGUESA RESTAURADO *** */}
                    <button className="md:hidden p-2 rounded-md hover:bg-gray-700" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
                    </button>
                </header>
                
                {isMenuOpen && <div className="md:hidden bg-gray-800 border-b border-gray-700"><MenuNav /></div>}

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