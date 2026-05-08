import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../components/ToastContext';
import API_BASE from '../utils/config';

export default function Warehouse() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allTechFields, setAllTechFields] = useState([]);
  
  // Стейты для категорий и фильтрации
  const [newCatName, setNewCatName] = useState('');
  const [newCatTechFields, setNewCatTechFields] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  // Стейты для создания нового техполя
  const [newTechField, setNewTechField] = useState({ key: '', label: '' });
  const [isAddingTechField, setIsAddingTechField] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Расширен стейт для динамических характеристик
  const [newProduct, setNewProduct] = useState({ 
    name: '', price: '', stock: '', category: '', description: '',
    megapixels: '', sensor_type: '', video_resolution: '', weight: '',
    power: '', frequency: '', battery_life: '', connection: ''
  });
  const [images, setImages] = useState([]); // Несколько изображений
  const [imagePreviews, setImagePreviews] = useState([]); // Превью существующих

  const toast = useToast();

  const getHeaders = () => {
    const token = localStorage.getItem('access');
    console.log("Token from localStorage:", token);
    if (!token) {
      console.warn("❌ Токена нет в localStorage!");
    }
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const userRes = await axios.get(`${API_BASE}me/`, { headers: getHeaders() });
      setUser(userRes.data);

      const [p, c, t] = await Promise.all([
        axios.get(`${API_BASE}products/`, { headers: getHeaders() }),
        axios.get(`${API_BASE}categories/`, { headers: getHeaders() }),
        axios.get(`${API_BASE}tech-fields/`, { headers: getHeaders() })
      ]);
      setProducts(p.data);
      setCategories(c.data);
      setAllTechFields(t.data);
    } catch (err) { console.error("Ошибка загрузки данных", err); }
  };

  // --- НОВАЯ ЛОГИКА КАТЕГОРИЙ ---
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const response = await axios.post(`${API_BASE}categories/`, 
        { name: newCatName, tech_field_ids: newCatTechFields }, 
        { headers: getHeaders() }
      );
      console.log("Категория создана:", response.data);
      setNewCatName('');
      setNewCatTechFields([]);
      setIsCategoryModalOpen(false);
      fetchInitialData();
    } catch (err) { 
      console.error("Ошибка создания категории:", err);
      toast.addToast("Ошибка при создании категории: " + (err.response?.data?.name?.[0] || err.message), "error"); 
    }
  };

  const handleAddTechField = async (e) => {
    if (e) e.preventDefault();
    if (!newTechField.key.trim() || !newTechField.label.trim()) return;
    try {
      const response = await axios.post(`${API_BASE}tech-fields/`, newTechField, { headers: getHeaders() });
      console.log("Техполе создано:", response.data);
      setAllTechFields([...allTechFields, response.data]);
      setNewCatTechFields([...newCatTechFields, response.data.id]);
      setNewTechField({ key: '', label: '' });
      setIsAddingTechField(false);
    } catch (err) { 
      console.error("Ошибка создания техполя:", err);
      toast.addToast("Ошибка при создании поля: " + err.message, "error"); 
    }
  };

  const toggleTechField = (fieldId) => {
    setNewCatTechFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(f => f !== fieldId)
        : [...prev, fieldId]
    );
  };

  const deleteCategory = async (e, id) => {
    e.stopPropagation(); // Не дает сработать клику по фильтру
    if (window.confirm("Удалить категорию?")) {
      try {
        await axios.delete(`${API_BASE}categories/${id}/`, { headers: getHeaders() });
        if (selectedFilter === id) setSelectedFilter(null);
        fetchInitialData();
      } catch (err) { toast.addToast("Не удалось удалить категорию", "error"); }
    }
  };

  // --- ЛОГИКА ТОВАРОВ ---
  const startEdit = (product) => {
    // Создаем объект с базовыми значениями
    const updatedProduct = {
      name: product.name || '',
      price: product.price || '',
      stock: product.stock || '',
      category: product.category || '',
      description: product.description || '',
      megapixels: product.megapixels || '',
      sensor_type: product.sensor_type || '',
      video_resolution: product.video_resolution || '',
      weight: product.weight || '',
      power: product.power || '',
      frequency: product.frequency || '',
      battery_life: product.battery_life || '',
      connection: product.connection || ''
    };
    
    // Добавляем tech_values к этому же объекту
    if (product.tech_values) {
      product.tech_values.forEach(tv => {
        updatedProduct[tv.tech_field.key] = tv.value || '';
      });
    }
    
    // Загружаем существующие изображения
    const existingImages = (product.images || []).map(img => ({
      id: img.id,
      url: img.image.startsWith('http') ? img.image : `${API_BASE}${img.image}`
    }));
    
    // Обновляем всё сразу
    setEditingProduct(product);
    setNewProduct(updatedProduct);
    setImagePreviews(existingImages);
    setImages([]);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    
    if (user.role === 'seller') {
      // Продавец меняет цену и количество
      formData.append('price', newProduct.price);
      formData.append('stock', newProduct.stock);
    } else {
      // Админы меняют всё. Проходимся по всем ключам, чтобы подхватить динамические поля
      Object.keys(newProduct).forEach(key => {
        // Всегда отправляем поле, даже если оно пустое, чтобы обновить на null
        formData.append(key, newProduct[key] || '');
      });
      // Добавляем новые изображения
      images.forEach((img, index) => {
        formData.append(`images`, img);
      });
    }

    try {
      const headersConfig = {
        ...getHeaders(),
      };
      delete headersConfig['Content-Type'];
      
      console.log("Отправляю запрос с headers:", headersConfig);
      console.log("Изображений:", images.length);
      
      if (editingProduct) {
        await axios.patch(`${API_BASE}products/${editingProduct.id}/`, formData, {
          headers: headersConfig
        });
      } else {
        await axios.post(`${API_BASE}products/`, formData, {
          headers: headersConfig
        });
      }
      closeModal();
      fetchInitialData();
    } catch (err) { 
      console.error("Ошибка сохранения:", err);
      toast.addToast("Ошибка сохранения. Проверьте данные.", "error"); 
    }
  };

  const deleteProduct = async (id) => {
    if (window.confirm("Удалить товар?")) {
      await axios.delete(`${API_BASE}products/${id}/`, { headers: getHeaders() });
      fetchInitialData();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setNewProduct({ 
      name: '', price: '', stock: '', category: '', description: '',
      megapixels: '', sensor_type: '', video_resolution: '', weight: '',
      power: '', frequency: '', battery_life: '', connection: ''
    });
    setImages([]);
    setImagePreviews([]);
  };

  // --- ДИНАМИЧЕСКИЕ ПОЛЯ ---
  const renderTechFields = () => {
    const cat = categories.find(c => String(c.id) === String(newProduct.category));
    if (!cat || !cat.tech_fields || cat.tech_fields.length === 0) return null;

    return (
      <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-slate-950/50 rounded-2xl border border-sky-500/20">
        {cat.tech_fields.map(field => (
          <input 
            key={field.id}
            type="text" 
            placeholder={field.label} 
            className="bg-slate-800 p-4 rounded-xl outline-none" 
            value={newProduct[field.key] || ''} 
            onChange={e => setNewProduct({...newProduct, [field.key]: e.target.value})} 
          />
        ))}
      </div>
    );
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

        {/* Секция категорий (Фильтр и Создание) */}
        <section className="mb-12 bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
          <div className="flex flex-wrap gap-3 mb-6">
            <button 
              onClick={() => setSelectedFilter(null)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${!selectedFilter ? 'bg-white text-black' : 'bg-slate-800 text-slate-400'}`}
            >
              Все
            </button>
            {categories.map(cat => (
              <div 
                key={cat.id} 
                onClick={() => setSelectedFilter(cat.id)}
                className={`border border-slate-700 pl-4 pr-2 py-2 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${selectedFilter === cat.id ? 'bg-sky-500 text-black border-sky-500' : 'bg-slate-800 hover:bg-slate-700'}`}
              >
                <span className="text-sm font-bold">{cat.name}</span>
                {isFullAdmin && (
                  <button onClick={(e) => deleteCategory(e, cat.id)} className="text-slate-500 hover:text-rose-500 px-2">✕</button>
                )}
              </div>
            ))}
          </div>
          
          {isFullAdmin && (
            <button 
              onClick={() => {
                setNewCatName('');
                setNewCatTechFields([]);
                setIsCategoryModalOpen(true);
              }}
              className="bg-slate-100 text-black px-6 py-3 rounded-xl font-bold hover:bg-white transition-colors"
            >
              + Новая категория
            </button>
          )}
        </section>

        {/* Список товаров (с применением фильтра) */}
        <div className="space-y-12">
          {categories.filter(c => !selectedFilter || c.id === selectedFilter).map(cat => (
            <div key={cat.id} className="space-y-4">
              <h2 className="text-2xl font-bold border-l-4 border-sky-500 pl-4 uppercase tracking-tight">{cat.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.filter(p => p.category === cat.id).map(product => (
                  <div key={product.id} className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex items-center gap-6 group">
                    <div className="w-20 h-20 bg-slate-800 rounded-2xl overflow-hidden flex-shrink-0 relative group/image">
                      {product.images && product.images.length > 0 ? (
                        <>
                          <img 
                            src={product.images[0].image.startsWith('http') ? product.images[0].image : `${API_BASE}${product.images[0].image}`} 
                            className="w-full h-full object-cover" 
                            alt={product.name} 
                          />
                          {product.images.length > 1 && (
                            <div className="absolute top-1 right-1 bg-sky-500 text-white text-xs px-2 py-1 rounded font-bold">
                              +{product.images.length - 1}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">Нет фото</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold">{product.name}</h3>
                      <p className="text-sky-400 font-mono text-xl">{product.price} ₸</p>
                      <p className={`text-sm font-bold ${product.is_in_stock ? 'text-green-400' : 'text-red-400'}`}>
                        Кол-во: {product.stock}
                      </p>
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
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <form onSubmit={handleSaveProduct} className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] max-w-2xl w-full my-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold italic uppercase">{editingProduct ? '✎ Редактирование товара' : '➕ Новый товар'}</h2>
                  {editingProduct && (
                    <p className="text-slate-500 text-sm mt-2">ID: #{editingProduct.id} | {editingProduct.name}</p>
                  )}
                </div>
              </div>
              
              {user.role === 'seller' ? (
                /* ИНТЕРФЕЙС ПРОДАВЦА */
                <div className="space-y-6 py-4">
                  <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-2">Объект изменения</span>
                    <span className="text-xl font-black">{editingProduct?.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 space-y-0">
                    <div className="space-y-3">
                      <label className="text-sky-500 text-xs font-bold uppercase ml-2">Новая цена (₸)</label>
                      <input 
                        type="number" required
                        className="w-full bg-slate-950 p-6 rounded-3xl outline-none border-2 border-sky-500 text-2xl font-mono text-center"
                        value={newProduct.price}
                        onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sky-500 text-xs font-bold uppercase ml-2">Кол-во товаров</label>
                      <input 
                        type="number" required
                        className="w-full bg-slate-950 p-6 rounded-3xl outline-none border-2 border-sky-500 text-2xl font-mono text-center"
                        value={newProduct.stock}
                        onChange={e => setNewProduct({...newProduct, stock: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* ИНТЕРФЕЙС АДМИНА */
                <div className="space-y-4">
                  {editingProduct && (
                    <div className="bg-slate-950/50 border border-sky-500/30 p-4 rounded-2xl">
                      <p className="text-[10px] text-sky-400 uppercase tracking-widest mb-2">📝 Редактирование существующего товара</p>
                      <p className="text-slate-400 text-sm">Все поля заполнены текущими значениями. Измените то, что нужно.</p>
                    </div>
                  )}
                  <input type="text" placeholder="Наименование" required className="w-full bg-slate-800 p-4 rounded-2xl outline-none" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                  <div className="grid grid-cols-3 gap-4">
                    <input type="number" placeholder="Цена" required className="bg-slate-800 p-4 rounded-2xl outline-none" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                    <input type="number" placeholder="Кол-во" required className="bg-slate-800 p-4 rounded-2xl outline-none" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
                    <select className="bg-slate-800 p-4 rounded-2xl outline-none" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                      <option value="">Категория</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  
                  {/* Вызов функции для рендера специфичных характеристик */}
                  {renderTechFields()}

                  <textarea placeholder="Описание" rows="3" className="w-full bg-slate-800 p-4 rounded-2xl outline-none mt-4" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})}></textarea>
                  
                  {/* Существующие изображения */}
                  {imagePreviews.length > 0 && (
                    <div className="mt-4">
                      <label className="text-slate-400 text-xs uppercase mb-2 block">Текущие фото:</label>
                      <div className="flex flex-wrap gap-3">
                        {imagePreviews.map((img, idx) => (
                          <div key={img.id || idx} className="relative group">
                            <img src={img.url} alt="preview" className="w-24 h-24 object-cover rounded-lg border border-slate-700" />
                            <button 
                              type="button"
                              onClick={() => setImagePreviews(imagePreviews.filter((_, i) => i !== idx))}
                              className="absolute -top-2 -right-2 bg-rose-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Загрузка новых изображений */}
                  <div className="mt-4 p-4 bg-slate-800 rounded-2xl border border-dashed border-slate-700">
                    <label className="text-slate-400 text-xs uppercase mb-2 block">Добавить фото:</label>
                    <input 
                      type="file" 
                      multiple
                      accept="image/*"
                      onChange={e => {
                        const newFiles = Array.from(e.target.files || []);
                        setImages([...images, ...newFiles]);
                      }} 
                      className="text-sm w-full"
                    />
                    {images.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-3">
                        {images.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img 
                              src={URL.createObjectURL(img)} 
                              alt="new" 
                              className="w-24 h-24 object-cover rounded-lg border border-slate-600" 
                            />
                            <button 
                              type="button"
                              onClick={() => setImages(images.filter((_, i) => i !== idx))}
                              className="absolute -top-2 -right-2 bg-rose-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-sky-500 text-slate-950 font-black py-5 rounded-3xl uppercase hover:scale-105 transition-transform">Сохранить</button>
                <button type="button" onClick={closeModal} className="flex-1 border border-slate-700 font-bold py-5 rounded-3xl uppercase hover:bg-slate-800 transition-colors">Отмена</button>
              </div>
            </form>
          </div>
        )}

        {/* МОДАЛЬНОЕ ОКНО КАТЕГОРИЙ */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <form onSubmit={handleAddCategory} className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] max-w-2xl w-full my-8 space-y-6">
              <h2 className="text-3xl font-bold italic uppercase">Новая категория</h2>
              
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Название категории" 
                  required
                  className="w-full bg-slate-800 p-4 rounded-2xl outline-none" 
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
                
                <div className="bg-slate-800 p-6 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sky-500 text-xs font-bold uppercase">Технические характеристики</label>
                    <button 
                      type="button"
                      onClick={() => setIsAddingTechField(!isAddingTechField)}
                      className="text-xs bg-sky-500/20 text-sky-400 px-3 py-1 rounded-lg hover:bg-sky-500/30 transition-colors"
                    >
                      + Новое поле
                    </button>
                  </div>

                  {isAddingTechField && (
                    <div className="bg-slate-700 p-4 rounded-xl space-y-3 border border-sky-500/30">
                      <input 
                        type="text" 
                        placeholder="Ключ (англ, без пробелов)" 
                        required
                        className="w-full bg-slate-800 p-3 rounded-lg outline-none text-sm"
                        value={newTechField.key}
                        onChange={(e) => setNewTechField({...newTechField, key: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                      />
                      <input 
                        type="text" 
                        placeholder="Название (например: Мегапиксели)" 
                        required
                        className="w-full bg-slate-800 p-3 rounded-lg outline-none text-sm"
                        value={newTechField.label}
                        onChange={(e) => setNewTechField({...newTechField, label: e.target.value})}
                      />
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={handleAddTechField}
                          className="flex-1 bg-sky-500 text-black text-sm font-bold py-2 rounded-lg hover:bg-sky-400 transition-colors"
                        >
                          Добавить
                        </button>
                        <button 
                          type="button"
                          onClick={() => {setIsAddingTechField(false); setNewTechField({key: '', label: ''});}} 
                          className="flex-1 bg-slate-600 text-sm font-bold py-2 rounded-lg hover:bg-slate-500 transition-colors"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {allTechFields.length === 0 ? (
                      <div className="text-slate-400 text-sm py-4 text-center">Нет доступных полей. Создайте новое!</div>
                    ) : (
                      allTechFields.map(field => (
                        <label key={field.id} className="flex items-center gap-3 cursor-pointer hover:bg-slate-700/50 p-2 rounded-lg transition-colors">
                          <input 
                            type="checkbox" 
                            checked={newCatTechFields.includes(field.id)}
                            onChange={() => toggleTechField(field.id)}
                            className="w-5 h-5 rounded border-slate-600 accent-sky-500"
                          />
                          <span className="text-slate-300 text-sm">{field.label}</span>
                          <span className="text-slate-500 text-xs ml-auto">{field.key}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-sky-500 text-slate-950 font-black py-5 rounded-3xl uppercase hover:scale-105 transition-transform">Создать</button>
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="flex-1 border border-slate-700 font-bold py-5 rounded-3xl uppercase hover:bg-slate-800 transition-colors">Отмена</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}