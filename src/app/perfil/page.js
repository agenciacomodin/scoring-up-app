"use client";

import { useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../firebase.js"; 
import { doc, setDoc, getDoc, collection, addDoc, query, onSnapshot, orderBy } from "firebase/firestore";
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- COMPONENTES ---

const MiCuenta = ({ user }) => ( 
    <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl mb-4 font-bold">Tus Datos</h2>
        <p>Email: {user.email}</p>
    </div>
);

const SolicitarInforme = ({ user }) => { 
    const [nombre, setNombre] = useState(""); 
    const [dni, setDni] = useState(""); 
    const handleS = async (e) => { e.preventDefault(); try { await setDoc(doc(db, "solicitudes", user.uid),{nombre,dni,email:user.email,estado:"Pendiente",fecha:new Date()}); window.location.href="https://mpago.la/2ADsZ18";} catch(e){console.error(e)} }; 
    return ( 
        <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Solicitar Informe</h2>
            <form onSubmit={handleS} className="space-y-6">
                <div><label>Nombre</label><input type="text" value={nombre} onChange={(e)=>setNombre(e.target.value)} required className="w-full mt-1 bg-gray-700 p-2 rounded-lg"/></div>
                <div><label>DNI</label><input type="number" value={dni} onChange={(e)=>setDni(e.target.value)} required className="w-full mt-1 bg-gray-700 p-2 rounded-lg"/></div>
                <button type="submit" className="w-full bg-green-600 p-3 rounded-lg font-bold">Pagar y Solicitar</button>
            </form>
        </div> 
    )
};

const MisInformes = ({ user }) => { 
    const [solicitud, setS] = useState(null); 
    useEffect(() => {
        const unsub = onSnapshot(doc(db,"solicitudes",user.uid), (doc) => {
            if (doc.exists()) {
                setS(doc.data());
            }
        }); 
        return () => unsub();
    },[user.uid]); 
    return ( 
        <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Historial</h2>
            {solicitud ? 
                <div>
                    <p>Fecha: {solicitud.fecha && new Date(solicitud.fecha.seconds*1000).toLocaleDateString()}</p>
                    <p>Estado: {solicitud.estado}</p>
                </div> 
                : 
                <p>No hay solicitudes.</p>
            }
        </div>
    )
};

const Billetera = ({ user }) => {
    const [movimientos, setMovimientos] = useState([]);
    const [descripcion, setDescripcion] = useState('');
    const [monto, setMonto] = useState('');
    const [tipo, setTipo] = useState('ingreso');
    const [categoria, setCategoria] = useState('otros');

    useEffect(() => {
        const q = query(collection(db, 'users', user.uid, 'movimientos'), orderBy('fecha', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMovimientos(snapshot.docs.map(d=>({...d.data(), id:d.id})));
        });
        return unsubscribe;
    }, [user.uid]);

    const agregarMovimiento = async (e) => {
        e.preventDefault();
        await addDoc(collection(db,'users',user.uid,'movimientos'),{
            descripcion,
            monto:tipo==='ingreso'? Number(monto) : -Number(monto),
            tipo,
            categoria:tipo==='ingreso'?'ingresos':categoria,
            fecha:new Date()
        });
        setDescripcion('');
        setMonto('');
    };

    const { balance, dataGrafico } = useMemo(() => {
        const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((acc, m) => acc + m.monto, 0);
        const egresos = movimientos.filter(m => m.tipo === 'egreso').reduce((acc, m) => acc + m.monto, 0);
        const egresosPorCategoria = movimientos.filter(m => m.tipo === 'egreso').reduce((acc, m) => {
            const cat = m.categoria || 'otros'; // Si no hay categoría, va a 'otros'
            acc[cat] = (acc[cat] || 0) + -m.monto;
            return acc;
        }, {});
        const dataGrafico = Object.entries(egresosPorCategoria).map(([name, value]) => ({ name, value }));
        return { balance: ingresos + egresos, dataGrafico };
    }, [movimientos]);

    const COLORS=['#0088FE','#00C49F','#FFBB28','#FF8042'];

    return (
        <div className="space-y-8">
            <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg h-96">
                <h3 className="text-lg font-bold mb-4">Distribución de Egresos</h3>
                {dataGrafico.length > 0 ? (
                <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                        <Pie data={dataGrafico} dataKey="value" nameKey="name" label>
                           {dataGrafico.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
                ) : <p className="text-gray-500">No hay egresos para mostrar.</p>}
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
                 <h2 className="text-xl font-bold mb-4">Agregar Movimiento</h2>
                <form onSubmit={agregarMovimiento} className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label>Descripción</label><input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full mt-1 bg-gray-700 p-2 rounded-lg" required/></div>
                        <div><label>Monto</label><input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} className="w-full mt-1 bg-gray-700 p-2 rounded-lg" required/></div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div><label>Tipo</label><div className="mt-2 flex space-x-2"><button type="button" onClick={() => setTipo('ingreso')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${tipo === 'ingreso' ? 'bg-green-600' : 'bg-gray-600'}`}>Ingreso</button><button type="button" onClick={() => setTipo('egreso')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${tipo === 'egreso' ? 'bg-red-600' : 'bg-gray-600'}`}>Egreso</button></div></div>
                         {tipo === 'egreso' && (<div><label>Categoría</label><select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full mt-1 bg-gray-700 p-2.5 rounded-lg"><option value="vivienda">Vivienda</option><option value="comida">Comida</option><option value="transporte">Transporte</option><option value="servicios">Servicios</option><option value="otros">Otros</option></select></div>)}
                    </div>
                    <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold">Agregar</button>
                </form>
            </div>
            <div>
                <h2 className="text-xl font-bold mb-4">Últimos Movimientos</h2>
                <ul className="space-y-2">{movimientos.map(m=><li key={m.id} className="flex justify-between bg-gray-700 p-3 rounded-lg"><span>{m.descripcion}</span><span className={m.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'}>${m.monto.toLocaleString('es-AR')}</span></li>)}</ul>
            </div>
        </div>
    )
};

const Educacion = () => { 
    const cats=[{n:'Deudas',l:[{t:'Leer Veraz',c:true},{t:'Salir Veraz',c:true}]},{n:'Ahorro',l:[{t:'Método 50/30/20',c:true},{t:'Invertir',c:false}]}]; 
    return (
        <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-3xl font-bold mb-6">Educación Financiera</h2>
            <div className="space-y-8">
                {cats.map(c=>(
                    <div key={c.n}>
                        <h3 className="text-xl font-bold text-green-400 mb-4">{c.n}</h3>
                        <ul className="space-y-3">
                           {c.l.map(l=>(
                                <li key={l.t} className="flex items-center justify-between bg-gray-700 p-4 rounded-lg hover:bg-gray-600 cursor-pointer" onClick={() => alert('Próximamente: ' + l.t)}>
                                    <span>{l.t}</span>
                                    <span className={`px-3 py-1 text-xs rounded-full ${l.c ?'bg-green-500':'bg-yellow-500'}`}>{l.c?'✔ Visto':'Pendiente'}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    )
};


// --- Componente Principal ---
export default function PerfilPage() {
    const [currentUser, setCurrentUser] = useState(null); 
    const [loading, setLoading] = useState(true); 
    const [activeTab, setActiveTab] = useState('billetera'); 
    const router = useRouter();
    
    useEffect(() => { 
        const unsub = onAuthStateChanged(auth, u => {
            if(u) setCurrentUser(u); 
            else router.push('/login'); 
            setLoading(false);
        }); 
        return unsub;
    },[router]);

    const handleLogout = async () => { await signOut(auth); router.push('/login'); };

    if (loading) return <div className="flex justify-center items-center h-screen bg-gray-900"><p>Cargando...</p></div>;
    
    if (currentUser) {
        return (
            <div className="min-h-screen bg-gray-900 text-white">
                <header className="flex justify-between items-center p-4 bg-gray-800"><h1 className="text-xl font-bold text-green-400">SCORING UP</h1><button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 py-2 px-3 rounded-lg text-sm">Cerrar Sesión</button></header>
                <div className="flex">
                    <aside className="w-64 bg-gray-800 p-4 space-y-2 shrink-0">
                        <button onClick={() => setActiveTab('educacion')} className={`w-full text-left p-3 rounded-lg ${activeTab === 'educacion' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>Educación</button>
                        <button onClick={() => setActiveTab('billetera')} className={`w-full text-left p-3 rounded-lg ${activeTab === 'billetera' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>Mi Billetera</button>
                        <button onClick={() => setActiveTab('informes')} className={`w-full text-left p-3 rounded-lg ${activeTab === 'informes' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>Mis Informes</button>
                        <button onClick={() => setActiveTab('solicitar')} className={`w-full text-left p-3 rounded-lg ${activeTab === 'solicitar' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>Solicitar Informe</button>
                        <button onClick={() => setActiveTab('cuenta')} className={`w-full text-left p-3 rounded-lg ${activeTab === 'cuenta' ? 'bg-green-600' : 'hover:bg-gray-700'}`}>Mi Cuenta</button>
                    </aside>
                    <main className="flex-1 p-8 overflow-y-auto">
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