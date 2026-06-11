// src/App.jsx
import AppRoutes from './routes/AppRoutes';
import { ThemeProvider } from './context/ThemeContext';
import { useLocalNotifications } from './hooks/useLocalNotifications';

function App() {
  useLocalNotifications();

  return (
    <ThemeProvider>
      <div className="min-h-screen transition-colors duration-300">
        <AppRoutes />
      </div>
    </ThemeProvider>
  );
}

export default App;
