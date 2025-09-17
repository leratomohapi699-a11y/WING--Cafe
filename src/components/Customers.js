import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({});

  useEffect(() => {
    fetch('/api/customers')
      .then(r => r.json())
      .then(setCustomers);
  }, []);

  async function save(e) {
    e.preventDefault();
    if (form.id) {
      await fetch('/api/customers/' + form.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
    } else {
      await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
    }
    setForm({});
    fetch('/api/customers')
      .then(r => r.json())
      .then(setCustomers);
    Swal.fire('Saved', '', 'success');
  }

  async function remove(id) {
    const r = await Swal.fire({
      title: 'Delete?',
      showCancelButton: true
    });
    if (r.isConfirmed) {
      await fetch('/api/customers/' + id, { method: 'DELETE' });
      fetch('/api/customers')
        .then(r => r.json())
        .then(setCustomers);
      Swal.fire('Deleted', '', 'success');
    }
  }

  return (
    <div>
      <div className='card'>
        <h3>Add / Edit Customer</h3>
        <form onSubmit={save}>
          <div className='form-row'>
            <input
              className='input'
              placeholder='Name'
              value={form.name || ''}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <input
              className='input'
              placeholder='Contact'
              value={form.contact || ''}
              onChange={e => setForm({ ...form, contact: e.target.value })}
            />
            <input
              className='input'
              placeholder='Email'
              value={form.email || ''}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div style={{ marginTop: 8 }}>
            <button className='button' type='submit'>
              Save
            </button>
          </div>
        </form>
      </div>
      <div style={{ marginTop: 12 }} className='card table'>
        <h3>Customers</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.contact}</td>
                <td>{c.email}</td>
                <td>
                  <button className='button' onClick={() => setForm(c)}>
                    Edit
                  </button>
                  <button
                    className='button alt'
                    style={{ marginLeft: 8 }}
                    onClick={() => remove(c.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
