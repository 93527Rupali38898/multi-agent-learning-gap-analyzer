import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

import {
  Search,
  ChevronLeft,
  Database,
  Code,
  Layers,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { motion } from "framer-motion";
const NODE_API = import.meta.env.VITE_NODE_URL;
const AI_API = import.meta.env.VITE_AI_URL;
const TopicList = () => {
  const { courseId } = useParams(); // e.g., "DSA"
  const navigate = useNavigate();

  const [problems, setProblems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Initial Load (Node Backend se saara data lao)
  useEffect(() => {
    fetchInitialData();
  }, [courseId]);

  // 2. Search Effect (Debounced - Python Backend se Fuzzy Search karo)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.length > 1) {
        fetchFuzzyResults();
      } else if (searchTerm.length === 0) {
        // Agar search empty hai, wapas normal data dikhao
        fetchInitialData();
      }
    }, 300); // 300ms delay to prevent too many API calls

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const fetchInitialData = async () => {
    try {
      // NOTE: Initial load Node server se hi rakhte hain for speed
      const res = await axios.get(`http://localhost:5000/api/problems`);
      const filtered = res.data.filter((p) => p.topic === courseId);
      setProblems(filtered);
      const uniqueCats = [...new Set(filtered.map((p) => p.category))];
      setCategories(uniqueCats);
    } catch (err) {
      console.error("Node Server Error:", err);
    }
  };

  const fetchFuzzyResults = async () => {
    if (!searchTerm) return;
    setLoading(true);
    try {
      // Ab hum hardcoded localhost nahi, API variable use karenge
      const res = await axios.get(`${AI_API}/search`, {
        params: { query: searchTerm, topic: courseId }
      });
      setProblems(res.data);
      if (res.data.length > 0) setSelectedCategory("Search Results");
    } catch (err) {
      console.error("AI Server unreachable");
    } finally {
      setLoading(false);
    }
};

  const handleBack = () => {
    setSearchTerm("");
    setSelectedCategory(null);
    fetchInitialData(); // Reset data
  };

  // Current View Logic
  const displayProblems =
    selectedCategory === "Search Results"
      ? problems
      : problems.filter((p) => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <button
          onClick={handleBack}
          className="flex items-center text-gray-500 hover:text-white mb-8 transition-colors group"
        >
          <ChevronLeft
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
          {selectedCategory ? "Back to Categories" : "Back to Courses"}
        </button>

        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <h1 className="text-5xl font-black italic tracking-tighter uppercase">
              {selectedCategory === "Search Results"
                ? "AI SEARCH"
                : selectedCategory || courseId}
              <span className="text-cyan-500">
                {" "}
                {selectedCategory === "Search Results" ? "RESULTS" : "MODULES"}
              </span>
            </h1>
            <p className="text-gray-400 mt-2">
              {loading
                ? "AI Agent is searching..."
                : "Powered by Python Levenshtein Engine"}
            </p>
          </div>

          {/* AI Search Bar */}
          <div className="relative w-full md:w-80">
            <Search
              className={`absolute left-4 top-3.5 ${loading ? "text-cyan-500 animate-pulse" : "text-gray-500"}`}
              size={18}
            />
            <input
              type="text"
              value={searchTerm}
              placeholder="Search..." // <--- Changed as per request (Simple)
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-full py-3 pl-12 pr-6 text-sm focus:border-cyan-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* VIEW 1: CATEGORY CARDS (Normal View) */}
        {!selectedCategory && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((cat, index) => (
              <motion.div
                key={cat}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedCategory(cat)}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-cyan-500 cursor-pointer group transition-all relative overflow-hidden"
              >
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-cyan-500 mb-6 group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                  <Layers size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{cat}</h3>
                <p className="text-gray-500 text-sm mb-6">
                  {problems.filter((p) => p.category === cat).length} Challenges
                </p>
                <div className="flex items-center text-cyan-500 font-bold text-sm gap-2">
                  EXPLORE{" "}
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-2 transition-transform"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* VIEW 2: QUESTION LIST (Category or Search Results) */}
        {selectedCategory && (
          <div className="grid gap-4">
            {displayProblems.map((prob, index) => (
              <motion.div
                key={prob.problemId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/ide/${prob.problemId}`)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:bg-zinc-800 cursor-pointer flex justify-between items-center group transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-gray-500 border border-zinc-800 group-hover:text-cyan-500 group-hover:border-cyan-500 transition-all">
                    <Code size={18} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-200 group-hover:text-cyan-500 transition-colors">
                      {prob.title}
                    </h4>
                    <p className="text-sm text-gray-500 line-clamp-1">
                      {prob.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Difficulty Badge */}
                  <span
                    className={`px-3 py-1 rounded text-xs font-bold border ${
                      prob.difficulty === "Easy"
                        ? "border-green-500/30 text-green-500"
                        : prob.difficulty === "Medium"
                          ? "border-yellow-500/30 text-yellow-500"
                          : "border-red-500/30 text-red-500"
                    }`}
                  >
                    {prob.difficulty}
                  </span>
                </div>
              </motion.div>
            ))}

            {displayProblems.length === 0 && !loading && (
              <div className="text-center py-20 text-gray-500">
                No matches found via AI Search.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicList;
