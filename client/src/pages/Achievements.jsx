import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Trophy, Star, Target, Flame, Award, ShieldCheck, Zap, Medal, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Achievements = () => {
  const { user } = useAuth();

  // Stats Data
  const stats = [
    { label: 'Total Points', value: '1,250', icon: <Star className="text-yellow-500" size={24}/>, color: 'border-yellow-500/20' },
    { label: 'Global Rank', value: '#12', icon: <Trophy className="text-cyan-500" size={24}/>, color: 'border-cyan-500/20' },
    { label: 'Problems Solved', value: '45', icon: <Target className="text-green-500" size={24}/>, color: 'border-green-500/20' },
    { label: 'Current Streak', value: '7 Days', icon: <Flame className="text-orange-500" size={24}/>, color: 'border-orange-500/20' },
  ];

  // Badges Data
  const badges = [
    { name: "Logic Master", desc: "Solved 10 Linked List Problems", icon: <Zap className="text-yellow-400" />, unlocked: true },
    { name: "Python Pro", desc: "Completed Python Basics", icon: <Award className="text-blue-400" />, unlocked: true },
    { name: "Fast Solver", desc: "Solved a medium problem in < 5 mins", icon: <Medal className="text-purple-400" />, unlocked: false },
    { name: "System Architect", desc: "Completed Advanced DSA", icon: <ShieldCheck className="text-emerald-400" />, unlocked: false },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">
              SOLVER <span className="text-cyan-500">STATISTICS</span>
            </h1>
            <p className="text-zinc-500 mt-2 font-medium tracking-widest uppercase text-xs">
              Performance Dashboard for {user?.displayName || 'Learner'}
            </p>
          </motion.div>
          
          <div className="bg-zinc-900/50 border border-zinc-800 px-6 py-3 rounded-full flex items-center gap-3 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
             <span className="text-[10px] font-black text-zinc-400 tracking-[0.2em] uppercase">Sutra Protocol Active</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {stats.map((s, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -5, backgroundColor: "rgba(24, 24, 27, 0.6)" }}
              className={`bg-zinc-900/40 border ${s.color} p-8 rounded-3xl backdrop-blur-sm transition-colors`}
            >
              <div className="bg-black/40 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-zinc-800">
                {s.icon}
              </div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">{s.label}</p>
              <h2 className="text-4xl font-black mt-2 tracking-tighter">{s.value}</h2>
            </motion.div>
          ))}
        </div>

        {/* Badges Section */}
        <h2 className="text-2xl font-black italic mb-6 flex items-center gap-3 tracking-tighter">
            <Award className="text-cyan-500" /> EARNED BADGES
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {badges.map((badge, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ scale: 1.02 }}
                  className={`p-6 rounded-3xl border ${badge.unlocked ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-950 border-zinc-900/50 opacity-40'} transition-all`}
                >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${badge.unlocked ? 'bg-zinc-800 shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'bg-zinc-900'}`}>
                        {badge.icon}
                    </div>
                    <h4 className="font-bold text-lg tracking-tight">{badge.name}</h4>
                    <p className="text-zinc-500 text-xs mt-1 leading-relaxed">{badge.desc}</p>
                    {!badge.unlocked && (
                      <div className="mt-4 flex items-center gap-2">
                        <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                          <div className="h-full w-1/3 bg-zinc-700"></div>
                        </div>
                        <span className="text-[9px] font-bold text-zinc-700 uppercase">Locked</span>
                      </div>
                    )}
                </motion.div>
            ))}
        </div>

        {/* Call to Action Card (The Footer Part) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border border-zinc-800 rounded-[2.5rem] p-12 text-center relative overflow-hidden group"
        >
            {/* Background Effects */}
            <div className="absolute -top-24 -right-24 p-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-700">
                <Trophy size={400} />
            </div>
            
            <div className="relative z-10">
              <div className="w-20 h-20 bg-black border border-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <Trophy size={40} className="text-cyan-500 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
              </div>
              
              <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-4">
                Unlock Master <span className="text-cyan-500">Certificates</span>
              </h3>
              
              <p className="text-zinc-500 mt-4 max-w-xl mx-auto leading-relaxed font-medium">
                Every milestone you cross on Sutra AI brings you closer to industrial-grade certifications. 
                Complete the <span className="text-white font-bold underline decoration-cyan-500/50 underline-offset-4">Data Structures</span> module to unlock your first professional badge.
              </p>

              {/* Functional Link Component */}
              <Link to="/courses" className="inline-block mt-10">
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(6, 182, 212, 0.2)" }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white text-black font-black px-12 py-5 rounded-full text-xs tracking-[0.2em] hover:bg-cyan-400 transition-all uppercase flex items-center gap-3 group/btn"
                >
                    Start Learning Now
                    <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
            </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Achievements;