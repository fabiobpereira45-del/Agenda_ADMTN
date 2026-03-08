import { Outlet, Link, useLocation } from 'react-router-dom';
import { Calendar, LogIn, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function PublicLayout() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Início', path: '/' },
    { name: 'Pré-Agenda', path: '/pre-agenda' }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center w-full bg-[#f8fafc] selection:bg-indigo-100 selection:text-indigo-900">

      {/* Navbar Fixed & Sticky */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? 'glass py-2 border-b border-white/40'
          : 'bg-transparent py-4'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">

            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="p-1 rounded-xl shadow-lg group-hover:shadow-indigo-500/30 transition-shadow">
                <img src="/logo.png" alt="Logo ADMTN" className="h-10 w-auto" />
              </div>
              <span className={`font-bold text-xl tracking-tight transition-colors ${isScrolled ? 'text-slate-800' : 'text-slate-800'}`}>
                Agenda <span className="text-indigo-600">ADMTN</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 relative ${location.pathname === link.path
                    ? 'text-indigo-600 bg-indigo-50/80 shadow-sm'
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100/50'
                    }`}
                >
                  {link.name}
                </Link>
              ))}

              <div className="h-6 w-px bg-slate-300 mx-2"></div>

              <Link
                to="/login"
                className="flex items-center space-x-2 px-5 py-2 rounded-full text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                <LogIn className="h-4 w-4" />
                <span>Acesso Master</span>
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-[64px] z-40 md:hidden glass border-b border-slate-200/50 shadow-xl max-h-[calc(100vh-80px)] overflow-y-auto"
          >
            <div className="px-4 pt-2 pb-6 space-y-2 flex flex-col min-h-fit">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-3 rounded-lg text-base font-medium ${location.pathname === link.path
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-2 border-t border-slate-200/50">
                <Link
                  to="/login"
                  className="flex items-center justify-center space-x-2 px-4 py-3 mt-2 rounded-lg text-base font-medium bg-slate-900 text-white"
                >
                  <LogIn className="h-5 w-5" />
                  <span>Acesso Master</span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 w-full flex flex-col pt-20">
        <Outlet />
      </main>

      <footer className="w-full bg-slate-900 text-slate-400 py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600/20 p-1.5 rounded-lg">
              <Calendar className="h-5 w-5 text-indigo-400" />
            </div>
            <span className="font-semibold text-slate-200">Agenda ADMTN</span>
          </div>
          <p className="text-sm text-center md:text-left">
            &copy; {new Date().getFullYear()} Assembléia de Deus Min. Tancredo Neves. Reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
