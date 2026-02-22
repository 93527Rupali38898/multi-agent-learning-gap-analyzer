import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Trophy, LayoutDashboard, BookOpen, User as UserIcon } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-black/90 backdrop-blur-xl sticky top-0 z-50">
      <Link to="/courses" className="flex items-center gap-2 group">
        <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <span className="text-black font-black italic text-lg">S</span>
        </div>
        <span className="text-xl font-black italic tracking-tighter text-white uppercase">Sutra AI</span>
      </Link>
      
      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-6 text-[11px] font-bold tracking-[0.2em] text-zinc-500">
            <Link to="/courses" className="hover:text-cyan-400 flex items-center gap-2 transition-all"><BookOpen size={14}/> MODULES</Link>
            <Link to="/dashboard" className="hover:text-cyan-400 flex items-center gap-2 transition-all"><LayoutDashboard size={14}/> DASHBOARD</Link>
            <Link to="/achievements" className="hover:text-cyan-400 flex items-center gap-2 transition-all"><Trophy size={14}/> ACHIEVEMENTS</Link>
        </div>
        
        {user && (
          <div className="flex items-center gap-4 pl-6 border-l border-zinc-800">
             <div className="relative group cursor-pointer">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000"></div>
                {user.photoURL ? (
                    <img src={user.photoURL} alt="User" className="relative w-9 h-9 rounded-full border-2 border-zinc-900 object-cover" />
                ) : (
                    <div className="relative w-9 h-9 bg-zinc-800 rounded-full flex items-center justify-center text-cyan-400 border-2 border-zinc-900">
                        <UserIcon size={18} />
                    </div>
                )}
             </div>
             <button onClick={() => { logout(); navigate('/login'); }} className="p-2 text-zinc-500 hover:text-red-500 transition-colors">
               <LogOut size={20} />
             </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;