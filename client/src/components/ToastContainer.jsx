import React, { useState, useEffect } from 'react';
import { toast } from '../services/toast';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export default function ToastContainer() {
  const [toastsList, setToastsList] = useState([]);

  useEffect(() => {
    return toast.subscribe((newToasts) => {
      setToastsList(newToasts);
    });
  }, []);

  if (toastsList.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-100 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toastsList.map((t) => {
        let typeStyles = {
          border: 'border-saffron-500',
          bg: 'bg-white/95 backdrop-blur-md',
          text: 'text-gray-800',
          progress: 'bg-saffron-500',
          icon: <Info className="w-5 h-5 text-saffron-600 shrink-0" />
        };

        if (t.type === 'success') {
          typeStyles = {
            border: 'border-emerald-500',
            bg: 'bg-emerald-50/95 backdrop-blur-md',
            text: 'text-emerald-950',
            progress: 'bg-emerald-500',
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          };
        } else if (t.type === 'error') {
          typeStyles = {
            border: 'border-red-500',
            bg: 'bg-red-50/95 backdrop-blur-md',
            text: 'text-red-950',
            progress: 'bg-red-500',
            icon: <AlertCircle className="w-5 h-5 text-red-650 shrink-0" />
          };
        } else if (t.type === 'warning') {
          typeStyles = {
            border: 'border-amber-500',
            bg: 'bg-amber-50/95 backdrop-blur-md',
            text: 'text-amber-950',
            progress: 'bg-amber-500',
            icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          };
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto relative overflow-hidden flex items-start space-x-3 p-4 rounded-2xl border shadow-lg animate-toast-in ${typeStyles.bg} ${typeStyles.border}`}
          >
            {typeStyles.icon}
            
            <div className="flex-1 text-xs font-semibold leading-relaxed pr-2 select-text text-gray-800">
              {t.message}
            </div>

            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-gray-400 hover:text-gray-700 hover:bg-black/5 rounded-full p-1 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {t.duration > 0 && (
              <div 
                className={`absolute bottom-0 left-0 h-1 toast-progress-bar ${typeStyles.progress}`}
                style={{ animationDuration: `${t.duration}ms` }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
