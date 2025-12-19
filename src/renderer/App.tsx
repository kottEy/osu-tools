import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { Header, Sidebar } from './components/layout';
import Cursor from './pages/Cursor';
import HitCircle from './pages/HitCircle';
import HitSounds from './pages/HitSounds';
import SkinIniPage from './pages/SkinIni';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <div className="main-area">
          <Header />
          <main className="content">
            <Routes>
              <Route path="/" element={<Cursor />} />
              <Route path="/cursor" element={<Cursor />} />
              <Route path="/hitcircle" element={<HitCircle />} />
              <Route path="/hitsounds" element={<HitSounds />} />
              <Route path="/skinini" element={<SkinIniPage />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
