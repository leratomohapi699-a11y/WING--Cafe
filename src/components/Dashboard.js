import React, {useEffect, useState, useRef} from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
export default function Dashboard(){
  const [summary,setSummary]=useState({totalProducts:0,totalStock:0,totalRevenue:0,products:[],sales:[]});
  useEffect(()=>{ fetch('/api/summary').then(r=>r.json()).then(setSummary); },[]);
  const { products, sales } = summary;
  // compute data
  const byCategory = products.reduce((acc,p)=>{ acc[p.category]=(acc[p.category]||0)+(p.price*p.quantity); return acc; },{});
  const stockByCategory = products.reduce((acc,p)=>{ acc[p.category]=(acc[p.category]||0)+p.quantity; return acc; },{});
  const salesByDate = sales.reduce((acc,s)=>{ const d = s.date.split('T')[0]; acc[d]=(acc[d]||0)+s.revenue; return acc; },{});
  const barData = { labels:Object.keys(byCategory), datasets:[{ label:'Sales value by category', data:Object.values(byCategory) }] };
  const pieData = { labels:Object.keys(stockByCategory), datasets:[{ data:Object.values(stockByCategory) }] };
  const lineData = { labels:Object.keys(salesByDate), datasets:[{ label:'Revenue', data:Object.values(salesByDate), fill:false }] };
  return (<div><div className='grid'><div className='card'><h3>Total products</h3><p>{summary.totalProducts}</p></div><div className='card'><h3>Total revenue</h3><p>M{summary.totalRevenue?.toFixed(2)}</p></div><div className='card'><h3>Total stock</h3><p>{summary.totalStock}</p></div></div><div className='grid'><div className='card'><Bar data={barData} /></div><div className='card'><Pie data={pieData} /></div><div className='card'><Line data={lineData} /></div></div><div style={{marginTop:12}} className='card'><a href='/api/export/excel'><button className='button'>Export Excel</button></a> <a href='/api/export/pdf' style={{marginLeft:8}}><button className='button alt'>Export PDF</button></a></div></div>); }