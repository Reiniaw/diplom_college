import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Warehouse() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: '', description: '' });
  const [image, setImage] = useState(null);

  const token = localStorage.getItem('access');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Сначала получаем данные о себе для проверки роли
      const userRes = await axios.get('http://127.0.0.1:8000/api/me/', { headers });
      setUser(userRes.data);

      const [p, c] = await Promise.all([
        axios.get('http://127.0.0.1:8000/api/products/', { headers }),
        axios.get('http://127.0.0.1:8000/api/categories/', { headers })
      ]);
      setProducts(p.data);
      setCategories(c.data);
    } catch (err) { console.error("Ошибка загрузки данных"); }
  };

  const startEdit = (product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      price: product.price,
      category: product.category,
      description: product.description || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    
    if (user.role === 'seller') {
      // Продавец может менять ТОЛЬКО цену
      formData.append('price', newProduct.price);
    } else {
      // Остальные могут менять всё
      formData.append('name', newProduct.name);
      formData.append('price', newProduct.price);
      formData.append('category', newProduct.category);
      formData.append('description', newProduct.description);
      if (image) formData.append('image', image);
    }

    try {
      if (editingProduct) {
        await axios.patch(`http://127.0.0.1:8000/api/products/${editingProduct.id}/`, formData, {
          headers: { ...headers, 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('http://127.0.0.1:8000/api/products/', formData, {
          headers: { ...headers, 'Content-Type': 'multipart/form-data' }
        });
      }
      closeModal();
      fetchInitialData();
    } catch (err) { alert("Ошибка сохранения"); }
  };

  const deleteProduct = async (id) => {
    if (window.confirm("Удалить товар?")) {
      await axios.delete(`http://127.0.0.1:8000/api/products/${id}/`, { headers });
      fetchInitialData();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setNewProduct({ name: '', price: '', category: '', description: '' });
    setImage(null);
  };

  if (!user) return <div className="p-20 text-center text-white font-mono">Аутентификация в системе...</div>;

  const isFullAdmin = ['director', 'manager'].includes(user.role);

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">Складской учет</h1>
          {isFullAdmin && (
            <button onClick={() => setIsModalOpen(true)} className="bg-sky-500 text-slate-950 px-8 py-3 rounded-2xl font-bold hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20">
              + Добавить товар
            </button>
          )}
        </header>

        {/* Секция категорий */}
        <section className="mb-12 bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
          <div className="flex flex-wrap gap-3 mb-6">
            {categories.map(cat => (
              <div key={cat.id} className="bg-slate-800 border border-slate-700 pl-4 pr-2 py-2 rounded-xl flex items-center gap-3">
                <span className="text-sm font-bold">{cat.name}</span>
                {isFullAdmin && <button className="text-slate-500 hover:text-rose-500">✕</button>}
              </div>
            ))}
          </div>
          {isFullAdmin && (
            <form className="flex gap-3">
              <input type="text" placeholder="Новая категория..." className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex-1 outline-none" />
              <button className="bg-slate-100 text-black px-6 py-3 rounded-xl font-bold">Создать</button>
            </form>
          )}
        </section>

        {/* Список товаров */}
        <div className="space-y-12">
          {categories.map(cat => (
            <div key={cat.id} className="space-y-4">
              <h2 className="text-2xl font-bold border-l-4 border-sky-500 pl-4">{cat.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.filter(p => p.category === cat.id).map(product => (
                  <div key={product.id} className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex items-center gap-6 group">
                    <div className="w-20 h-20 bg-slate-800 rounded-2xl overflow-hidden flex-shrink-0">
                      {product.image && <img src={product.image} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold">{product.name}</h3>
                      <p className="text-sky-400 font-mono text-xl">{product.price} ₸</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => startEdit(product)} className="p-3 bg-slate-800 rounded-xl hover:bg-sky-500 hover:text-black transition-all">✎</button>
                      {isFullAdmin && (
                        <button onClick={() => deleteProduct(product.id)} className="p-3 bg-slate-800 rounded-xl hover:bg-rose-500 transition-all">✕</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Модальное окно */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <form onSubmit={handleSaveProduct} className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] max-w-lg w-full space-y-6">
              <h2 className="text-3xl font-bold italic uppercase">{editingProduct ? 'Редактирование' : 'Новый товар'}</h2>
              
              {user.role === 'seller' ? (
                /* ИНТЕРФЕЙС ПРОДАВЦА */
                <div className="space-y-6 py-4">
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-2">Объект изменения</span>
                    <span className="text-xl font-black">{editingProduct?.name}</span>
                  </div>
                  <div className="space-y-3">
                    <label className="text-sky-500 text-xs font-bold uppercase ml-2">Новая цена (₸)</label>
                    <input 
                      type="number" required
                      className="w-full bg-slate-950 p-6 rounded-3xl outline-none border-2 border-sky-500 text-4xl font-mono text-center"
                      value={newProduct.price}
                      onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                    />
                  </div>
                </div>
              ) : (
                /* ИНТЕРФЕЙС АДМИНА */
                <div className="space-y-4">
                  <input type="text" placeholder="Наименование" required className="w-full bg-slate-800 p-4 rounded-2xl outline-none" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Цена" required className="bg-slate-800 p-4 rounded-2xl outline-none" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                    <select className="bg-slate-800 p-4 rounded-2xl outline-none" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                      <option value="">Категория</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <textarea placeholder="Описание" rows="3" className="w-full bg-slate-800 p-4 rounded-2xl outline-none" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})}></textarea>
                  <div className="p-4 bg-slate-800 rounded-2xl border border-dashed border-slate-700">
                    <input type="file" onChange={e => setImage(e.target.files[0])} className="text-sm" />
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-sky-500 text-slate-950 font-black py-5 rounded-3xl uppercase">Сохранить</button>
                <button type="button" onClick={closeModal} className="flex-1 border border-slate-700 font-bold py-5 rounded-3xl uppercase">Отмена</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}