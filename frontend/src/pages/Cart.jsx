import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Cart() {
  const [cart, setCart] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('access');
  const headers = { Authorization: `Bearer ${token}` };
  
  const [shippingInfo, setShippingInfo] = useState({
    address: '',
    phone: '',
    delivery_time: 'Как можно скорее',
    notes: ''
  });

  useEffect(() => {
    fetchCart();
    fetchLastOrderInfo(); // Подтягиваем старые данные при загрузке
  }, []);

  const fetchCart = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/orders/current-cart/', { headers });
      setCart(res.data);
    } catch (err) {
      console.error("Ошибка загрузки корзины");
    }
  };

  // --- ЛОГИКА АВТОЗАПОЛНЕНИЯ ---
  const fetchLastOrderInfo = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/orders/', { headers });
      // Берем самый свежий заказ, который уже был оформлен (не корзину)
      const lastOrder = res.data.find(o => o.status !== 'cart');
      
      if (lastOrder) {
        setShippingInfo(prev => ({
          ...prev,
          address: lastOrder.address || '',
          phone: lastOrder.phone || '',
        }));
      }
    } catch (err) {
      console.error("История заказов пуста, автозаполнение пропущено");
    }
  };

  // --- МАСКА ТЕЛЕФОНА (Формат: +7 (XXX) XXX-XX-XX) ---
  const handlePhoneChange = (e) => {
    let input = e.target.value.replace(/\D/g, ''); // Только цифры
    if (input.startsWith('7') || input.startsWith('8')) input = input.substring(1);
    
    let formatted = '+7 ';
    if (input.length > 0) formatted += '(' + input.substring(0, 3);
    if (input.length >= 4) formatted += ') ' + input.substring(3, 6);
    if (input.length >= 7) formatted += '-' + input.substring(6, 8);
    if (input.length >= 9) formatted += '-' + input.substring(8, 10);
    
    setShippingInfo({ ...shippingInfo, phone: formatted.substring(0, 18) });
  };

  const handleCheckout = async () => {
    if (!shippingInfo.address || shippingInfo.phone.length < 18) {
        alert("Пожалуйста, укажите полный адрес и корректный номер телефона!");
        return;
    }
    try {
      await axios.post(`http://127.0.0.1:8000/api/orders/${cart.id}/checkout/`, shippingInfo, { headers });
      alert("Заказ принят!");
      navigate('/profile');
    } catch (err) {
      alert("Ошибка при оформлении");
    }
  };

  if (!cart || cart.items.length === 0) return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
        <h2 className="text-xl text-slate-500 italic">Корзина пуста</h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black uppercase italic mb-12">Оформление</h1>

        {/* Список товаров */}
        <div className="space-y-4 mb-10">
          {cart.items.map(item => (
            <div key={item.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex justify-between items-center">
              <div className="flex items-center gap-4">
                <img src={item.product_image} className="w-16 h-16 rounded-xl object-cover" alt="" />
                <span className="font-bold">{item.product_name}</span>
              </div>
              <span className="font-mono text-sky-400">{item.total_price} ₸</span>
            </div>
          ))}
        </div>

        {/* ПАНЕЛЬ ДАННЫХ */}
{/* ПАНЕЛЬ ДАННЫХ */}
<div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] mb-10 space-y-4">
    <h2 className="text-xl font-bold uppercase italic text-sky-500 mb-4">Данные доставки</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-slate-500 ml-2">Телефон</label>
            <input 
                type="tel" 
                placeholder="+7 (7XX) XXX-XX-XX"
                className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:border-sky-500 font-mono"
                value={shippingInfo.phone}
                onChange={handlePhoneChange}
            />
        </div>
        <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-slate-500 ml-2">Желаемое время</label>
            <input 
                type="text" 
                className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:border-sky-500"
                value={shippingInfo.delivery_time}
                onChange={e => setShippingInfo({...shippingInfo, delivery_time: e.target.value})}
            />
        </div>
    </div>

    <div className="space-y-2">
        <label className="text-[10px] uppercase font-black text-slate-500 ml-2">Адрес доставки</label>
        <input 
            type="text" 
            placeholder="Город, улица, дом..."
            className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:border-sky-500"
            value={shippingInfo.address}
            onChange={e => setShippingInfo({...shippingInfo, address: e.target.value})}
        />
    </div>

    {/* ВОТ ОН, КОММЕНТАРИЙ */}
    <div className="space-y-2">
        <label className="text-[10px] uppercase font-black text-slate-500 ml-2">Комментарий к заказу</label>
        <textarea 
            placeholder="Например: подъезд 2, код домофона 123..."
            rows="3"
            className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:border-sky-500 resize-none"
            value={shippingInfo.notes}
            onChange={e => setShippingInfo({...shippingInfo, notes: e.target.value})}
        />
    </div>
</div>

        <div className="bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] flex justify-between items-center">
          <p className="text-4xl font-black">{cart.total_price} ₸</p>
          <button 
            onClick={handleCheckout}
            className="bg-sky-500 text-slate-950 px-12 py-5 rounded-2xl font-black uppercase italic hover:bg-sky-400 transition-all"
          >
            Оформить заказ
          </button>
        </div>
      </div>
    </div>
  );
}