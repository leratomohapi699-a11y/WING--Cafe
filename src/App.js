import React, { useEffect, useState } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import Sales from './components/Sales';
import Reports from './components/Reports';
import Customers from './components/Customers';
import './App.css';
Chart.register(...registerables);
export default function App(){ const [page,setPage]=useState('dashboard'); return (<div className='app'><Sidebar onNavigate={setPage} page={page}/><main className='content'><div className='header'><h2 style={{textTransform:'capitalize'}}>{page}</h2><div></div></div>{page==='dashboard'&&<Dashboard/>}{page==='products'&&<Products/>}{page==='sales'&&<Sales/>}{page==='reports'&&<Reports/>}{page==='customers'&&<Customers/>}<div className='footer card'>© {new Date().getFullYear()} Wings Cafe Stock System Email: leratomohapi5@gmail.com  </div></main></div>); }