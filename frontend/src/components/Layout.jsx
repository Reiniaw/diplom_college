import Header from "./Header";
import Footer from "./Footer";
import { ToastProvider } from "./ToastContext";

export default function Layout({ children }) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-900 text-gray-200 flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4">
          {children}
        </main>
        <Footer />
      </div>
    </ToastProvider>
  );
}
