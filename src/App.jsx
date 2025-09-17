// src/App.jsx
import AppRoutes from './routes/AppRoutes';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen transition-colors duration-300">
        <AppRoutes />
      </div>
    </ThemeProvider>
  );
}

export default App;