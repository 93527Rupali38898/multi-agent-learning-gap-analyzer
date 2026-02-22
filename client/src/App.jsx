import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Sirf aapke Modules (Tumhara Kaam)
import CourseSelect from './pages/CourseSelect';
import TopicList from './pages/TopicList';
import IDE from './pages/IDE';
import Lens from './pages/Lens';

function App() {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Routes>
        {/* Default Route: App khulte hi seedha Courses par jayega */}
        <Route path="/" element={<Navigate to="/courses" />} />

        {/* Aapka Main Flow */}
        <Route path="/courses" element={<CourseSelect />} />
        <Route path="/course/:courseId" element={<TopicList />} />
        <Route path="/ide/:problemId" element={<IDE />} />
        <Route path="/lens/:problemId" element={<Lens />} />

        {/* Fallback Route: Agar koi galat URL dale toh wapas courses par */}
        <Route path="*" element={<Navigate to="/courses" />} />
      </Routes>
    </div>
  );
}

export default App;