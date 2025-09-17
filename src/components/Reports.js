import React, { useEffect, useState } from 'react';

export default function Reports() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetch('/api/summary')
      .then(r => r.json())
      .then(setSummary);
  }, []);

  return (
    <div>
      <div className='card'>
        <h3>Reports</h3>
        <p className='small'>
          Export detailed reports to Excel or PDF (Products, Sales, Customers).
        </p>
        <div style={{ marginTop: 8 }}>
          <a href='/api/export/excel'>
            <button className='button'>Export Excel</button>
          </a>
          <a href='/api/export/pdf' style={{ marginLeft: 8 }}>
            <button className='button alt'>Export PDF</button>
          </a>
        </div>
      </div>
      {summary && (
        <div style={{ marginTop: 12 }} className='card'>
          <h4>Summary</h4>
          <p>Total products: {summary.totalProducts}</p>
          <p>Total stock: {summary.totalStock}</p>
          <p>Total revenue: M{summary.totalRevenue?.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}
