import React, { useState, useEffect } from 'react';

const MIN_DURATION = 3000;
const MAX_DURATION = 9000;
const MS_PER_CHAR = 40;

// Длинные/составные сообщения должны висеть дольше, чтобы их успели прочитать,
// но не вечно — поэтому считаем по длине текста с потолком в MAX_DURATION.
function getDuration(items) {
  const totalLength = items.join(' ').length;
  return Math.min(Math.max(MIN_DURATION + totalLength * MS_PER_CHAR, MIN_DURATION), MAX_DURATION);
}

export default function Toast({ message, type = 'success', onClose }) {
  const [visible, setVisible] = useState(true);
  const items = Array.isArray(message) ? message : [message];

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Время для анимации исчезновения
    }, getDuration(items));

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div
      className={`fixed top-20 left-4 right-4 sm:left-auto sm:w-96 z-50 p-4 rounded-2xl text-white shadow-lg transition-all duration-300 ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      } ${bgColor}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 text-sm font-semibold leading-snug">
          {items.length > 1 ? (
            <ul className="space-y-1 list-disc list-inside">
              {items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : (
            items[0]
          )}
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Закрыть"
          className="shrink-0 text-white/80 hover:text-white text-lg leading-none -mt-0.5"
        >
          ×
        </button>
      </div>
    </div>
  );
}