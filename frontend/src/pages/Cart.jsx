import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getHeaders, getProductImageUrl } from '../utils/helpers';
import { useToast } from '../components/ToastContext';
import API_BASE from '../utils/config';

// Статичный Kaspi QR (заглушка — замени на реальный QR своего магазина из Kaspi Business)
const KASPI_QR_URL = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://kaspi.kz/pay/ProLens';

const PAYMENT_METHODS = [
  { id: 'kaspi', label: 'Kaspi QR', sub: 'Мгновенная оплата', icon: '▣' },
  { id: 'card',  label: 'Банковская карта', sub: 'Visa / MasterCard', icon: '▭' },
];

// Маска для номера карты: 0000 0000 0000 0000
function formatCardNumber(val) {
  return val.replace(/\D/g, '').substring(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
// Маска MM/ГГ
function formatExpiry(val) {
  const digits = val.replace(/\D/g, '').substring(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + ' / ' + digits.slice(2);
}

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('kaspi');
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [receiptEmail, setReceiptEmail] = useState('');
  const [step, setStep] = useState('cart'); // 'cart' | 'payment' | 'success'
  const [placedOrderId, setPlacedOrderId] = useState(null);

  const navigate = useNavigate();
  const toast = useToast();

  const [shippingInfo, setShippingInfo] = useState({
    address: '',
    phone: '',
    delivery_time: 'Как можно скорее',
    notes: ''
  });

  useEffect(() => {
    fetchCart();
    fetchLastOrderInfo();
    // Подставляем email пользователя если есть
    const token = localStorage.getItem('access');
    if (token) {
      axios.get(`${API_BASE}me/`, { headers: getHeaders() })
        .then(res => { if (res.data.email) setReceiptEmail(res.data.email); })
        .catch(() => {});
    }
  }, []);

  const fetchCart = async () => {
    try {
      const res = await axios.get(`${API_BASE}orders/current-cart/`, { headers: getHeaders() });
      setCart(res.data);
    } catch (err) { console.error("Ошибка загрузки корзины"); }
  };

  const quantityTimers = useRef({});

  const handleUpdateQuantity = useCallback((itemId, newQuantity) => {
    if (newQuantity < 1) return;
    const item = cart?.items.find(i => i.id === itemId);
    if (item && newQuantity > item.product.stock) {
      toast.addToast(`На складе только ${item.product.stock} шт.`, "error");
      return;
    }
    // Оптимистично обновляем UI сразу
    setCart(prev => {
      if (!prev) return prev;
      const updatedItems = prev.items.map(i =>
        i.id === itemId
          ? { ...i, quantity: newQuantity, total_price: (parseFloat(i.price) * newQuantity).toFixed(2) }
          : i
      );
      const newTotal = updatedItems.reduce((sum, i) => sum + parseFloat(i.total_price), 0).toFixed(2);
      return { ...prev, items: updatedItems, total_price: newTotal };
    });
    // Debounce: отправляем запрос через 600мс после последнего нажатия
    if (quantityTimers.current[itemId]) clearTimeout(quantityTimers.current[itemId]);
    quantityTimers.current[itemId] = setTimeout(async () => {
      try {
        await axios.patch(`${API_BASE}order-items/${itemId}/`, { quantity: newQuantity }, { headers: getHeaders() });
        fetchCart(); // синхронизируем с сервером
      } catch (err) {
        const errorMsg = err.response?.data?.detail || err.response?.data?.quantity?.[0];
        toast.addToast(errorMsg?.includes('stock') ? "Товар закончился на складе" : (errorMsg || "Ошибка"), "error");
        fetchCart(); // откатываем если ошибка
      }
    }, 600);
  }, [cart]);

  const handleRemoveItem = async (itemId) => {
    setLoading(true);
    try {
      await axios.delete(`${API_BASE}order-items/${itemId}/`, { headers: getHeaders() });
      fetchCart();
      setDeleteConfirm(null);
    } catch (err) { toast.addToast("Ошибка при удалении товара", "error"); }
    finally { setLoading(false); }
  };

  const fetchLastOrderInfo = async () => {
    try {
      const res = await axios.get(`${API_BASE}orders/`, { headers: getHeaders() });
      const lastOrder = res.data.find(o => o.status !== 'cart');
      if (lastOrder) {
        setShippingInfo(prev => ({
          ...prev,
          address: lastOrder.address || '',
          phone: lastOrder.phone || '',
        }));
      }
    } catch (err) {}
  };

  const handlePhoneChange = (e) => {
    let input = e.target.value.replace(/\D/g, '');
    if (input.startsWith('7') || input.startsWith('8')) input = input.substring(1);
    let formatted = '+7 ';
    if (input.length > 0) formatted += '(' + input.substring(0, 3);
    if (input.length >= 4) formatted += ') ' + input.substring(3, 6);
    if (input.length >= 7) formatted += '-' + input.substring(6, 8);
    if (input.length >= 9) formatted += '-' + input.substring(8, 10);
    setShippingInfo({ ...shippingInfo, phone: formatted.substring(0, 18) });
  };

  // Переход к экрану оплаты
  const handleGoToPayment = () => {
    if (!shippingInfo.address.trim()) {
      toast.addToast("Укажите адрес доставки!", "error"); return;
    }
    if (shippingInfo.phone.length < 18) {
      toast.addToast("Укажите корректный номер телефона!", "error"); return;
    }
    setStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Финальное оформление
  const handleCheckout = async () => {
    if (paymentMethod === 'card') {
      const digits = cardData.number.replace(/\s/g, '');
      if (digits.length < 16) { toast.addToast("Введите полный номер карты", "error"); return; }
      if (cardData.expiry.replace(/\D/g, '').length < 4) { toast.addToast("Укажите срок действия карты", "error"); return; }
      if (cardData.cvv.length < 3) { toast.addToast("Укажите CVV код", "error"); return; }
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}orders/${cart.id}/checkout/`,
        {
          ...shippingInfo,
          receipt_email: receiptEmail,
          payment_method: paymentMethod,
        },
        { headers: getHeaders() }
      );
      setPlacedOrderId(res.data.id);
      setStep('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast.addToast(err.response?.data?.detail || "Ошибка при оформлении", "error");
    } finally {
      setLoading(false);
    }
  };

  // ─── ЭКРАН УСПЕХА ────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-green-500/40">
            <span className="text-4xl">✓</span>
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase italic mb-3">Заказ принят!</h1>
            <p className="text-slate-400">Заказ <span className="text-sky-400 font-mono font-bold">#{placedOrderId}</span> успешно оформлен</p>
          </div>
          {receiptEmail && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <p className="text-slate-400 text-sm">Чек отправлен на</p>
              <p className="text-sky-400 font-mono font-bold mt-1">{receiptEmail}</p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/profile')}
              className="flex-1 bg-sky-500 text-slate-950 py-4 rounded-2xl font-black uppercase hover:bg-sky-400 transition-all"
            >
              Мои заказы
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 border border-slate-700 py-4 rounded-2xl font-bold uppercase hover:bg-slate-800 transition-all"
            >
              В каталог
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4">
      <span className="text-6xl opacity-20">🛒</span>
      <h2 className="text-xl text-slate-500 italic">Корзина пуста</h2>
      <button onClick={() => navigate('/')} className="text-sky-500 hover:text-sky-400 transition-colors text-sm">
        ← Вернуться в каталог
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">

        {/* Прогресс шагов */}
        <div className="flex items-center gap-2 sm:gap-3 mb-8 sm:mb-10">
          {['cart', 'payment'].map((s, i) => {
            const labels = { cart: 'Корзина', payment: 'Оплата' };
            const active = step === s;
            const done = (s === 'cart' && step === 'payment');
            return (
              <React.Fragment key={s}>
                {i > 0 && <div className={`flex-1 h-px ${done ? 'bg-sky-500' : 'bg-slate-800'}`} />}
                <div className={`flex items-center gap-1 sm:gap-2 ${active ? 'text-white' : done ? 'text-sky-500' : 'text-slate-600'}`}>
                  <div className={`w-6 sm:w-7 h-6 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold border ${active ? 'bg-sky-500 border-sky-500 text-slate-950' : done ? 'bg-sky-500/20 border-sky-500 text-sky-400' : 'border-slate-700'}`}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-wide hidden sm:block">{labels[s]}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* ─── ШАГ 1: КОРЗИНА + ДОСТАВКА ─── */}
        {step === 'cart' && (
          <>
            <h1 className="text-2xl sm:text-4xl font-black uppercase italic mb-6 sm:mb-8">
              Оформление
              <span className="ml-3 text-base sm:text-xl font-mono text-slate-500 not-italic normal-case">
                {cart.items.length} {cart.items.length === 1 ? 'товар' : cart.items.length < 5 ? 'товара' : 'товаров'}
              </span>
            </h1>

            {/* Список товаров */}
            <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
              {cart.items.map(item => (
                <div key={item.id} className="bg-slate-900 border border-slate-800 p-3 sm:p-4 lg:p-5 rounded-2xl flex items-center gap-3 sm:gap-4">
                  <img src={item.product_image} className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl object-cover flex-shrink-0 bg-slate-800" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs sm:text-base truncate">{item.product_name}</p>
                    <p className="text-slate-400 text-[10px] sm:text-sm">{item.price} ₸ / шт.</p>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 bg-slate-950 rounded-xl px-1.5 sm:px-2 py-1 flex-shrink-0">
                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} disabled={loading}
                      className="w-6 h-6 sm:w-7 sm:h-7 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/40 transition disabled:opacity-50 font-bold text-xs sm:text-sm">−</button>
                    <span className="w-6 text-center font-bold text-xs sm:text-sm">{item.quantity}</span>
                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} disabled={loading}
                      className="w-6 h-6 sm:w-7 sm:h-7 bg-sky-500/20 text-sky-400 rounded-lg hover:bg-sky-500/40 transition disabled:opacity-50 font-bold text-xs sm:text-sm">+</button>
                  </div>
                  <span className="font-mono text-sky-400 text-xs sm:text-base w-20 sm:w-24 text-right flex-shrink-0">{item.total_price} ₸</span>
                  <button onClick={() => setDeleteConfirm(item.id)} disabled={loading}
                    className="w-7 h-7 sm:w-8 sm:h-8 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/40 transition disabled:opacity-50 flex items-center justify-center text-xs sm:text-sm flex-shrink-0">✕</button>
                </div>
              ))}
            </div>

            {/* Данные доставки */}
            <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 lg:p-8 rounded-[2rem] mb-6 space-y-3 sm:space-y-4">
              <h2 className="text-xs sm:text-base font-bold uppercase italic text-sky-500">Данные доставки</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-500 ml-2">Телефон</label>
                  <input type="tel" placeholder="+7 (7XX) XXX-XX-XX"
                    className="w-full bg-slate-950 border border-slate-800 p-3 sm:p-4 rounded-2xl outline-none focus:border-sky-500 font-mono text-xs sm:text-sm"
                    value={shippingInfo.phone} onChange={handlePhoneChange} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-500 ml-2">Желаемое время</label>
                  <input type="text"
                    className="w-full bg-slate-950 border border-slate-800 p-3 sm:p-4 rounded-2xl outline-none focus:border-sky-500 text-xs sm:text-sm"
                    value={shippingInfo.delivery_time}
                    onChange={e => setShippingInfo({...shippingInfo, delivery_time: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-slate-500 ml-2">Адрес доставки</label>
                <input type="text" placeholder="Город, улица, дом..."
                  className="w-full bg-slate-950 border border-slate-800 p-3 sm:p-4 rounded-2xl outline-none focus:border-sky-500 text-xs sm:text-sm"
                  value={shippingInfo.address}
                  onChange={e => setShippingInfo({...shippingInfo, address: e.target.value})} />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-slate-500 ml-2">Комментарий к заказу</label>
                <textarea placeholder="Например: подъезд 2, код домофона 123..." rows="2"
                  className="w-full bg-slate-950 border border-slate-800 p-3 sm:p-4 rounded-2xl outline-none focus:border-sky-500 resize-none text-xs sm:text-sm"
                  value={shippingInfo.notes}
                  onChange={e => setShippingInfo({...shippingInfo, notes: e.target.value})} />
              </div>
            </div>

            {/* Итог + кнопка */}
            <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 lg:p-8 rounded-[2rem] flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-2xl sm:text-4xl font-black font-mono">{cart.total_price} ₸</p>
              <button onClick={handleGoToPayment}
                className="w-full sm:w-auto bg-sky-500 text-slate-950 px-6 sm:px-10 py-3 sm:py-4 rounded-2xl font-black uppercase italic hover:bg-sky-400 transition-all text-sm sm:text-base">
                К оплате →
              </button>
            </div>
          </>
        )}

        {/* ─── ШАГ 2: ОПЛАТА ─── */}
        {step === 'payment' && (
          <>
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <button onClick={() => setStep('cart')} className="text-slate-500 hover:text-white transition-colors text-xs sm:text-sm">
                ← Назад
              </button>
              <h1 className="text-2xl sm:text-4xl font-black uppercase italic">Оплата</h1>
            </div>

            {/* Мини-сводка заказа */}
            <div className="bg-slate-900/50 border border-slate-800 p-4 sm:p-5 rounded-2xl mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-slate-400 text-[10px] sm:text-xs uppercase tracking-widest">Итого к оплате</p>
                <p className="text-xl sm:text-2xl font-black font-mono text-sky-400">{cart.total_price} ₸</p>
              </div>
              <div className="text-right text-xs">
                <p className="text-slate-400">Товаров: {cart.items.length}</p>
                <p className="text-slate-500 truncate max-w-[160px] sm:max-w-[200px]">{shippingInfo.address}</p>
              </div>
            </div>

            {/* Выбор метода оплаты */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6">
              {PAYMENT_METHODS.map(m => (
                <button key={m.id} type="button" onClick={() => setPaymentMethod(m.id)}
                  className={`p-3 sm:p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 sm:gap-2 text-xs sm:text-sm ${
                    paymentMethod === m.id
                      ? 'border-sky-500 bg-sky-500/10'
                      : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                  }`}>
                  <span className={`text-xl sm:text-2xl ${paymentMethod === m.id ? 'text-sky-400' : 'text-slate-500'}`}>{m.icon}</span>
                  <span className={`font-bold ${paymentMethod === m.id ? 'text-sky-400' : 'text-slate-300'}`}>{m.label}</span>
                  <span className="text-[10px] text-slate-500">{m.sub}</span>
                </button>
              ))}
            </div>

            {/* Kaspi QR */}
            {paymentMethod === 'kaspi' && (
              <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 lg:p-8 rounded-[2rem] mb-6 flex flex-col items-center gap-4 sm:gap-5">
                <p className="text-slate-400 text-xs sm:text-sm text-center">
                  Откройте приложение <span className="text-red-400 font-bold">Kaspi.kz</span> → «Оплатить» → «QR-код»
                </p>
                <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-lg">
                  <img
                    src={KASPI_QR_URL}
                    alt="Kaspi QR код"
                    className="w-40 h-40 sm:w-48 sm:h-48"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </div>
                <div className="bg-slate-950 rounded-2xl px-4 sm:px-6 py-2 sm:py-3 text-center w-full sm:w-auto">
                  <p className="text-slate-500 text-[10px] sm:text-xs">Сумма к оплате</p>
                  <p className="text-sky-400 font-mono font-black text-lg sm:text-2xl">{cart.total_price} ₸</p>
                </div>
                <p className="text-slate-600 text-xs text-center">После оплаты нажмите «Подтвердить заказ»</p>
              </div>
            )}

            {/* Форма карты */}
            {paymentMethod === 'card' && (
              <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 lg:p-8 rounded-[2rem] mb-6 space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-500 ml-2">Номер карты</label>
                  <input type="text" placeholder="0000 0000 0000 0000" maxLength={19}
                    className="w-full bg-slate-950 border border-slate-800 p-3 sm:p-4 rounded-2xl outline-none focus:border-sky-500 font-mono text-sm sm:text-base tracking-wider"
                    value={cardData.number}
                    onChange={e => setCardData({...cardData, number: formatCardNumber(e.target.value)})} />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-slate-500 ml-2">Срок действия</label>
                    <input type="text" placeholder="MM / ГГ" maxLength={7}
                      className="w-full bg-slate-950 border border-slate-800 p-3 sm:p-4 rounded-2xl outline-none focus:border-sky-500 font-mono text-xs sm:text-sm"
                      value={cardData.expiry}
                      onChange={e => setCardData({...cardData, expiry: formatExpiry(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-slate-500 ml-2">CVV</label>
                    <input type="password" placeholder="•••" maxLength={3}
                      className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:border-sky-500 font-mono text-sm"
                      value={cardData.cvv}
                      onChange={e => setCardData({...cardData, cvv: e.target.value.replace(/\D/g, '').substring(0, 3)})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-500 ml-2">Имя на карте</label>
                  <input type="text" placeholder="IVAN IVANOV"
                    className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:border-sky-500 font-mono text-sm uppercase"
                    value={cardData.name}
                    onChange={e => setCardData({...cardData, name: e.target.value.toUpperCase()})} />
                </div>
                <p className="text-slate-600 text-xs text-center pt-2">
                  🔒 Данные карты защищены и не сохраняются на сервере
                </p>
              </div>
            )}

            {/* Email для чека */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl mb-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-slate-500 ml-2">
                  📧 Email для чека
                </label>
                <input type="email" placeholder="your@email.com"
                  className="w-full bg-slate-950 border border-slate-800 p-4 rounded-2xl outline-none focus:border-sky-500 text-sm"
                  value={receiptEmail}
                  onChange={e => setReceiptEmail(e.target.value)} />
                <p className="text-slate-600 text-xs ml-2">Оставьте пустым, если чек не нужен</p>
              </div>
            </div>

            {/* Кнопка подтверждения */}
            <button onClick={handleCheckout} disabled={loading}
              className={`w-full py-5 rounded-2xl font-black uppercase italic text-lg transition-all ${
                loading
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-sky-500 text-slate-950 hover:bg-sky-400 hover:scale-[1.02]'
              }`}>
              {loading ? 'Оформляем...' : `Подтвердить заказ · ${cart.total_price} ₸`}
            </button>
          </>
        )}

        {/* Модальное окно удаления */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm w-full shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4">Удалить товар?</h3>
              <p className="text-slate-400 mb-6 text-sm">Это действие нельзя отменить</p>
              <div className="flex gap-4">
                <button onClick={() => setDeleteConfirm(null)} disabled={loading}
                  className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition disabled:opacity-50 font-bold text-sm">
                  Отмена
                </button>
                <button onClick={() => handleRemoveItem(deleteConfirm)} disabled={loading}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition disabled:opacity-50 font-bold text-sm">
                  {loading ? 'Удаляю...' : 'Удалить'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}