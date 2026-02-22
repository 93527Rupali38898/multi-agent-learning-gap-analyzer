import React, { useState } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip 
} from 'recharts';
import { ChevronLeft, ChevronRight, Zap, Trophy, Target } from 'lucide-react';

// --- DATA MOCK ---
const difficultyData = [
  { name: 'Easy', value: 12, color: '#00C49F' },   // Green
  { name: 'Medium', value: 8, color: '#FFBB28' },  // Yellow
  { name: 'Hard', value: 3, color: '#FF8042' },    // Orange
];

const gapData = [
  { subject: 'Logic', A: 120, fullMark: 150 },
  { subject: 'Syntax', A: 98, fullMark: 150 },
  { subject: 'Optim', A: 86, fullMark: 150 },
  { subject: 'Clean', A: 99, fullMark: 150 },
  { subject: 'Debug', A: 85, fullMark: 150 },
];

const activityData = [
  { name: 'Week 1', problems: 4 },
  { name: 'Week 2', problems: 7 },
  { name: 'Week 3', problems: 2 },
  { name: 'Week 4', problems: 9 },
];

// --- CUSTOM HEATMAP COMPONENT ---
const CustomHeatmap = () => {
  // Start from Feb 1, 2026
  const [startDate, setStartDate] = useState(new Date(2026, 1, 1)); // Month is 0-indexed (1 = Feb)

  const handlePrev = () => {
    const newDate = new Date(startDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setStartDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(startDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setStartDate(newDate);
  };

  // Generate 4 months of data
  const renderMonths = () => {
    let months = [];
    for (let i = 0; i < 4; i++) {
      let currentMonth = new Date(startDate);
      currentMonth.setMonth(startDate.getMonth() + i);
      
      const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
      const monthName = currentMonth.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      let days = [];
      for (let d = 1; d <= daysInMonth; d++) {
        // Random activity for demo (replace with real data logic)
        const isActive = Math.random() > 0.7; 
        const level = isActive ? Math.floor(Math.random() * 3) + 1 : 0; // 0 to 3
        
        days.push(
          <div 
            key={d}
            title={`${d} ${monthName}: ${isActive ? 'Solved' : 'No activity'}`}
            className={`w-3 h-3 rounded-sm cursor-pointer hover:border hover:border-white transition-all ${
              level === 0 ? 'bg-[#161b22]' : 
              level === 1 ? 'bg-[#00E5FF] opacity-30' : 
              level === 2 ? 'bg-[#00E5FF] opacity-60' : 'bg-[#00E5FF]'
            }`}
          ></div>
        );
      }

      months.push(
        <div key={i} className="flex flex-col gap-2">
          <span className="text-xs text-gray-500 font-mono uppercase">{monthName}</span>
          <div className="grid grid-rows-7 grid-flow-col gap-1">
             {days}
          </div>
        </div>
      );
    }
    return months;
  };

  return (
    <div className="bg-surface border border-gray-800 p-6 rounded-2xl w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-gray-400 flex items-center gap-2">
          <Zap size={16} className="text-primary"/> CONSISTENCY
        </h3>
        <div className="flex gap-2">
          <button onClick={handlePrev} className="p-1 hover:bg-white/10 rounded"><ChevronLeft size={16}/></button>
          <button onClick={handleNext} className="p-1 hover:bg-white/10 rounded"><ChevronRight size={16}/></button>
        </div>
      </div>
      <div className="flex gap-8 overflow-x-auto pb-2">
        {renderMonths()}
      </div>
    </div>
  );
};

const Dashboard = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 min-h-screen bg-background text-white">
      <h1 className="text-4xl font-black italic mb-8">
        PERFORMANCE <span className="text-primary">ANALYTICS</span>
      </h1>

      {/* TOP ROW: Heatmap & Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CustomHeatmap />
        </div>
        
        {/* Difficulty Pie Chart */}
        <div className="bg-surface border border-gray-800 p-6 rounded-2xl flex flex-col items-center justify-center">
           <h3 className="text-sm font-bold text-gray-400 mb-4 w-full text-left flex gap-2"><Target size={16}/> DIFFICULTY SPLIT</h3>
           <div className="w-full h-40">
             <ResponsiveContainer>
               <PieChart>
                 <Pie data={difficultyData} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                   {difficultyData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333'}}/>
               </PieChart>
             </ResponsiveContainer>
           </div>
           <div className="flex gap-4 text-xs mt-2">
             <span className="text-[#00C49F]">● Easy</span>
             <span className="text-[#FFBB28]">● Med</span>
             <span className="text-[#FF8042]">● Hard</span>
           </div>
        </div>
      </div>

      {/* BOTTOM ROW: Radar & Area Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Radar Chart (Learning Gap) */}
        <div className="bg-surface border border-gray-800 p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-gray-400 mb-4 flex gap-2"><Zap size={16}/> SKILL GAP</h3>
          <div className="w-full h-64">
            <ResponsiveContainer>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={gapData}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                <Radar name="Student" dataKey="A" stroke="#00E5FF" fill="#00E5FF" fillOpacity={0.3} />
                <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333'}}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Area Chart */}
        <div className="bg-surface border border-gray-800 p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-gray-400 mb-4 flex gap-2"><Trophy size={16}/> WEEKLY ACTIVITY</h3>
          <div className="w-full h-64">
            <ResponsiveContainer>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#00E5FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#555" tick={{fontSize: 10}}/>
                <YAxis stroke="#555" tick={{fontSize: 10}}/>
                <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333'}}/>
                <Area type="monotone" dataKey="problems" stroke="#00E5FF" fillOpacity={1} fill="url(#colorPv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;