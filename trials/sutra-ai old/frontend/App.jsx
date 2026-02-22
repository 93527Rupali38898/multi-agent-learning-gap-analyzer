import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./src/pages/Login";
import Register from "./src/pages/Register";
import CategoryList from "./src/pages/CategoryList";
import CategoryPage from "./src/pages/CategoryPage";
import ProblemList from "./src/pages/ProblemList";
import SutraIDE from "./src/pages/SutraIDE";
import Dashboard from "./src/pages/Dashboard";
import MobileLens from "./src/pages/MobileLens";
import Achievements from "./src/pages/Achievements";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CategoryList />} />         {/* temp home */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/course/:course" element={<CategoryPage />} />
        <Route path="/problems/:course/:category" element={<ProblemList />} />
        <Route path="/ide/:id" element={<SutraIDE />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/mobile-lens/:sessionId" element={<MobileLens />} />
        <Route path="/achievements" element={<Achievements />} />
      </Routes>
    </BrowserRouter>
  );
}