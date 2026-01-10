import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  // Effect ตรวจจับการเลื่อนหน้าจอ เพื่อปรับพื้นหลัง Navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    const storedUser = localStorage.getItem('user_data');
    if (storedUser) setUser(JSON.parse(storedUser));
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const logout = () => {
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_token');
    router.push('/login');
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-primary-900/90 backdrop-blur-md shadow-lg py-2' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo โรงเรียน */}
          <Link href="/" className="flex items-center gap-3 group">
             <div className="relative group-hover:scale-105 transition-transform duration-300">
                {/* ใส่ URL รูปโลโก้โรงเรียนที่น้องให้มา */}
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/9/9f/RSL001.png" 
                  alt="School Logo" 
                  className="h-12 w-auto drop-shadow-md"
                />
             </div>
             <div className="flex flex-col">
               <span className="text-white font-bold text-lg leading-none tracking-wide drop-shadow-md">Rattanakosin</span>
               <span className="text-blue-200 text-xs tracking-[0.2em] font-light">STUDENT LOAN</span>
             </div>
          </Link>

          {/* Menu */}
          <div className="flex gap-3 items-center">
            {!user ? (
              <>
                <Link href="/login" className="hidden md:block text-white/80 hover:text-white text-sm font-medium px-4 py-2 transition-colors">
                  เข้าสู่ระบบ
                </Link>
                <Link href="/register" className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white px-5 py-2 rounded-full text-sm font-medium transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_20px_rgba(255,255,255,0.2)]">
                  สร้างบัญชี
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3 pl-4 pr-2 py-1.5 bg-black/20 backdrop-blur-md rounded-full border border-white/10">
                <span className="hidden md:block text-sm text-white px-2">{user.fullname}</span>
                <button onClick={logout} className="bg-red-500/80 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-full transition-all">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}