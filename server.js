const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const CLIENT_BUILD = path.join(__dirname, '..', 'client');
// Serve static client in production if built (optional)
app.use('/static', express.static(path.join(CLIENT_BUILD, 'public')));

const DB_PRODUCTS = path.join(__dirname, 'products.json');
const DB_SALES = path.join(__dirname, 'sales.json');
const DB_CUSTOMERS = path.join(__dirname, 'customers.json');

function read(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file)); }
  catch(e){ return fallback; }
}
function write(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

// Sample endpoints for client
app.get('/api/products', (req, res) => res.json(read(DB_PRODUCTS, [])));
app.get('/api/sales', (req, res) => res.json(read(DB_SALES, [])));
app.get('/api/customers', (req, res) => res.json(read(DB_CUSTOMERS, [])));

// Add product
app.post('/api/products', (req, res) => {
  const db = read(DB_PRODUCTS, []);
  const p = req.body;
  if(!p.name) return res.status(400).json({error:'name required'});
  p.id = uuidv4();
  db.push(p);
  write(DB_PRODUCTS, db);
  res.json(p);
});

// Update product
app.put('/api/products/:id', (req, res) => {
  const id = req.params.id; const db = read(DB_PRODUCTS, []);
  const idx = db.findIndex(x=>x.id===id); if(idx===-1) return res.status(404).json({error:'not found'});
  db[idx] = {...db[idx], ...req.body};
  write(DB_PRODUCTS, db); res.json(db[idx]);
});

// Delete product
app.delete('/api/products/:id', (req,res)=>{
  const id = req.params.id; let db = read(DB_PRODUCTS, []);
  const before = db.length; db = db.filter(x=>x.id!==id); if(db.length===before) return res.status(404).json({error:'not found'});
  write(DB_PRODUCTS, db); res.json({success:true});
});

// Record sale (deduct stock)
app.post('/api/sales', (req,res)=>{
  const { productId, qty, customerId } = req.body;
  if(!productId || !qty) return res.status(400).json({error:'missing fields'});
  const products = read(DB_PRODUCTS, []);
  const p = products.find(x=>x.id===productId); if(!p) return res.status(404).json({error:'product not found'});
  if(p.quantity < qty) return res.status(400).json({error:'insufficient stock'});
  p.quantity -= qty; write(DB_PRODUCTS, products);
  const sales = read(DB_SALES, []);
  const sale = { id: uuidv4(), productId, qty, customerId: customerId||null, price: p.price, date: new Date().toISOString(), revenue: Number((p.price*qty).toFixed(2)) };
  sales.push(sale); write(DB_SALES, sales);
  res.json({sale, product:p});
});

// Customers CRUD
app.post('/api/customers', (req,res)=>{ const db = read(DB_CUSTOMERS, []); const c = req.body; c.id = uuidv4(); db.push(c); write(DB_CUSTOMERS, db); res.json(c); });
app.put('/api/customers/:id', (req,res)=>{ const id=req.params.id; const db=read(DB_CUSTOMERS,[]); const idx=db.findIndex(x=>x.id===id); if(idx===-1) return res.status(404).json({error:'not found'}); db[idx]={...db[idx],...req.body}; write(DB_CUSTOMERS,db); res.json(db[idx]); });
app.delete('/api/customers/:id', (req,res)=>{ const id=req.params.id; let db=read(DB_CUSTOMERS,[]); const before=db.length; db=db.filter(x=>x.id!==id); if(db.length===before) return res.status(404).json({error:'not found'}); write(DB_CUSTOMERS,db); res.json({success:true}); });

// Summary
app.get('/api/summary', (req,res)=>{
  const products = read(DB_PRODUCTS, []); const sales = read(DB_SALES, []);
  const totalProducts = products.length;
  const totalStock = products.reduce((s,p)=>s+p.quantity,0);
  const totalRevenue = sales.reduce((s,sale)=>s+sale.revenue,0);
  res.json({ totalProducts, totalStock, totalRevenue, products, sales });
});

// Excel export (Products, Sales, Customers)
app.get('/api/export/excel', async (req,res)=>{
  const products = read(DB_PRODUCTS, []); const sales = read(DB_SALES, []); const customers = read(DB_CUSTOMERS, []);
  const workbook = new ExcelJS.Workbook(); workbook.creator = 'Wings Cafe System';
  const pSheet = workbook.addWorksheet('Products'); pSheet.columns=[{header:'ID',key:'id',width:36},{header:'Name',key:'name',width:28},{header:'Category',key:'category',width:16},{header:'Price',key:'price',width:12},{header:'Quantity',key:'quantity',width:12},{header:'Description',key:'description',width:40}];
  products.forEach(r=>pSheet.addRow(r));
  const sSheet = workbook.addWorksheet('Sales'); sSheet.columns=[{header:'ID',key:'id',width:36},{header:'ProductID',key:'productId',width:36},{header:'Qty',key:'qty',width:10},{header:'Price',key:'price',width:12},{header:'Revenue',key:'revenue',width:12},{header:'Date',key:'date',width:24}];
  sales.forEach(r=>sSheet.addRow(r));
  const cSheet = workbook.addWorksheet('Customers'); cSheet.columns=[{header:'ID',key:'id',width:36},{header:'Name',key:'name',width:24},{header:'Contact',key:'contact',width:18},{header:'Email',key:'email',width:28}];
  customers.forEach(r=>cSheet.addRow(r));
  res.setHeader('Content-Disposition','attachment; filename=WingsCafe_Report.xlsx');
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  await workbook.xlsx.write(res); res.end();
});

// PDF export (summary or detailed depending on query param)
app.get('/api/export/pdf', (req,res)=>{
  const products = read(DB_PRODUCTS, []); const sales = read(DB_SALES, []); const customers = read(DB_CUSTOMERS, []);
  const doc = new PDFDocument({margin:30, size:'A4'});
  res.setHeader('Content-Type','application/pdf');
  res.setHeader('Content-Disposition','attachment; filename=WingsCafe_Report.pdf');
  doc.pipe(res);

  // Header
  doc.fontSize(18).text('Wings Cafe - Inventory Report', {align:'center'});
  doc.moveDown();
  // Summary
  const totalProducts = products.length; const totalSales = sales.length; const totalRevenue = sales.reduce((s,r)=>s+r.revenue,0);
  doc.fontSize(12).text(`Total products: ${totalProducts}`);
  doc.text(`Total sales records: ${totalSales}`);
  doc.text(`Total revenue: M${totalRevenue.toFixed(2)}`);
  doc.moveDown();

  // Products table (simple)
  doc.fontSize(14).text('Products', {underline:true}); doc.moveDown(0.3);
  products.slice(0,100).forEach(p=>{
    doc.fontSize(10).text(`${p.name} — ${p.category} — M${p.price} — Qty: ${p.quantity}`);
  });

  doc.addPage();
  doc.fontSize(14).text('Sales Records', {underline:true}); doc.moveDown(0.3);
  sales.slice(0,200).forEach(s=>{
    doc.fontSize(10).text(`ProductID:${s.productId} Qty:${s.qty} Revenue:M${s.revenue} Date:${s.date}`);
  });

  doc.end();
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=>console.log('Server running on port', PORT));