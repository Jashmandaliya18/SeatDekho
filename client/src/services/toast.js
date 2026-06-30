let listeners = new Set();
let toasts = [];
let toastId = 0;

export const toast = {
  show(message, type = 'success', duration = 4000) {
    const id = toastId++;
    const newToast = { id, message, type, duration };
    toasts = [...toasts, newToast];
    notifyListeners();

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
    return id;
  },
  success(message, duration) {
    return this.show(message, 'success', duration);
  },
  error(message, duration) {
    return this.show(message, 'error', duration);
  },
  info(message, duration) {
    return this.show(message, 'info', duration);
  },
  warning(message, duration) {
    return this.show(message, 'warning', duration);
  },
  dismiss(id) {
    toasts = toasts.filter(t => t.id !== id);
    notifyListeners();
  },
  getToasts() {
    return toasts;
  },
  subscribe(listener) {
    listeners.add(listener);
    // Trigger initially
    listener([...toasts]);
    return () => {
      listeners.delete(listener);
    };
  }
};

function notifyListeners() {
  listeners.forEach(listener => listener([...toasts]));
}

if (typeof window !== 'undefined') {
  window.showToast = (message, type = 'info', duration = 4000) => {
    toast.show(message, type, duration);
  };
  
  // Override native alert
  window.alert = (message) => {
    toast.show(message, 'info', 4500);
  };
}
