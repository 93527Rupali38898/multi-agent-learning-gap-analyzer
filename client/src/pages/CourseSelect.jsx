import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Code, Terminal, Database, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

// IDs MUST match the "topic" field in your JSON (e.g., "DSA", "C", "Python")
const courses = [
  { id: 'Python', title: 'Python Mastery', desc: 'Logic, strings, and automated syntax feedback.', icon: <Code />, color: 'from-yellow-400 to-orange-500' },
  { id: 'DSA', title: 'DSA Core', desc: 'Deep dive into Linked Lists, Heaps, and Algorithms.', icon: <Database />, color: 'from-cyan-400 to-blue-500' },
  { id: 'C', title: 'C Programming', desc: 'Pointers, Memory, and System-level logic.', icon: <Terminal />, color: 'from-blue-400 to-purple-500' },
];

const CourseSelect = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(query.toLowerCase()) || 
    c.id.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black italic text-white mb-6 tracking-tighter"
          >
            MASTER <span className="text-primary">TRAINING</span>
          </motion.h1>
          
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-3.5 text-gray-500" size={20} />
            <input 
              type="text" 
              placeholder="Search courses..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-surface border border-gray-800 rounded-full py-4 pl-12 pr-6 focus:border-primary focus:outline-none transition-all text-white shadow-2xl"
            />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredCourses.map((course) => (
            <motion.div 
              whileHover={{ y: -10 }}
              key={course.id}
              onClick={() => navigate(`/course/${course.id}`)}
              className="bg-surface border border-gray-800 rounded-3xl p-8 cursor-pointer group hover:border-primary/50 transition-all relative overflow-hidden"
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${course.color} flex items-center justify-center text-black mb-6 shadow-lg`}>
                {React.cloneElement(course.icon, { size: 28 })}
              </div>

              <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{course.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">{course.desc}</p>

              <div className="flex items-center text-primary font-bold text-sm gap-2">
                ENTER MODULE <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourseSelect;