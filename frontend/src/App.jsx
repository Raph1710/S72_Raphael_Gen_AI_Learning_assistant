import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Landing from './pages/landing.jsx';
import LoginPage from './pages/login.jsx';
import Quiz from './pages/quiz.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/quiz" element={<Quiz />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;