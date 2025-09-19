# 🍱 MealBox - Tiffin Admin Panel

A modern, professional tiffin service management platform built with React and Firebase. Streamline your food delivery business with comprehensive order management, customer tracking, and billing solutions.

![MealBox Dashboard](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react)
![Firebase](https://img.shields.io/badge/Firebase-9.0+-FFCA28?style=for-the-badge&logo=firebase)
![Vite](https://img.shields.io/badge/Vite-4.0+-646CFF?style=for-the-badge&logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0+-38B2AC?style=for-the-badge&logo=tailwind-css)

## 🚀 Features

### 📊 **Dashboard & Analytics**

- Real-time business metrics and KPIs
- Revenue tracking and growth analytics
- Order volume and customer insights
- Interactive charts and data visualization

### 👥 **Customer Management**

- Comprehensive client profiles
- Subscription and on-demand customer types
- Meal preferences and dietary requirements
- Delivery schedule management

### 📋 **Order Management**

- Daily delivery tracking
- Order status management
- Bulk order operations
- Delivery route optimization

### 💰 **Billing & Payments**

- Automated bill generation
- PDF invoice creation
- Payment tracking and history
- Revenue analytics

### 🔔 **Smart Notifications**

- Real-time order updates
- Delivery notifications
- Payment reminders
- System alerts

### 📱 **Mobile-First Design**

- Responsive design for all devices
- Touch-friendly interface
- Progressive Web App (PWA) ready
- Offline functionality

## 🛠️ **Tech Stack**

| Technology       | Purpose            | Version |
| ---------------- | ------------------ | ------- |
| **React**        | Frontend Framework | 18.2.0+ |
| **Vite**         | Build Tool         | 4.0+    |
| **Firebase**     | Backend & Database | 9.0+    |
| **Tailwind CSS** | Styling Framework  | 3.0+    |
| **React Router** | Navigation         | 6.0+    |
| **Heroicons**    | Icon Library       | 2.0+    |
| **jsPDF**        | PDF Generation     | Latest  |
| **Chart.js**     | Data Visualization | 4.0+    |

## 🚀 **Quick Start**

### **Prerequisites**

- Node.js (v16.0 or higher)
- npm or yarn package manager
- Firebase account
- Git

### **Installation**

1. **Clone the repository**

   ```bash
   git clone https://github.com/theopendraft/mealbox-admin-panel.git
   cd mealbox-admin-panel
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Firebase Setup**

   ```bash
   # Create a new Firebase project at https://console.firebase.google.com
   # Enable Authentication (Email/Password, Google, Facebook)
   # Create Firestore Database
   # Copy your Firebase config
   ```

4. **Environment Configuration**

   ```bash
   # Create .env file in the root directory
   cp .env.example .env
   ```

   Add your Firebase configuration:

   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id_here
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
   VITE_FIREBASE_APP_ID=your_app_id_here
   ```

5. **Start Development Server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open in Browser**
   ```
   http://localhost:5173
   ```

## 📁 **Project Structure**

```
mealbox-admin-panel/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components
│   │   ├── Sidebar.jsx     # Navigation sidebar
│   │   ├── Navbar.jsx      # Top navigation
│   │   └── ...
│   ├── pages/              # Application pages
│   │   ├── DashboardPage.jsx
│   │   ├── ClientListPage.jsx
│   │   ├── LandingPage.jsx
│   │   └── ...
│   ├── context/            # React Context providers
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   ├── config/             # Configuration files
│   │   └── firebase.js
│   ├── styles/             # CSS and styling
│   │   ├── index.css
│   │   └── animations.css
│   ├── utils/              # Utility functions
│   └── App.jsx             # Main application component
├── .env.example            # Environment variables template
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## 🔥 **Firebase Configuration**

### **Firestore Collections Structure**

```javascript
// clients collection
{
  id: "auto-generated",
  name: "Customer Name",
  phone: "+91XXXXXXXXXX",
  address: "Delivery Address",
  customerType: "subscribed" | "ondemand",
  plan: {
    lunch: { subscribed: true, price: 120 },
    dinner: { subscribed: false, price: 0 },
    startDate: "2024-01-01",
    endDate: "2024-12-31"
  },
  preferences: {
    rotiCount: 6,
    rice: "Yes",
    spiceLevel: "Medium",
    notes: "Special instructions"
  },
  deliverySchedule: {
    monday: true,
    tuesday: true,
    // ... other days
  },
  status: "active" | "paused" | "inactive",
  ownerId: "user_id",
  createdAt: timestamp
}
```

### **Authentication Setup**

1. Enable Authentication methods in Firebase Console:

   - Email/Password
   - Google Sign-In
   - Facebook Login

2. Add authorized domains:
   - `localhost` (for development)
   - Your production domain

## 🎨 **Design System**

### **Color Palette**

- **Primary**: Red (#EF4444) - Main brand color
- **Secondary**: Orange (#F97316) - Accent color
- **Success**: Orange (#EA580C) - Success states
- **Warning**: Amber (#F59E0B) - Warning states
- **Error**: Red (#DC2626) - Error states
- **Neutral**: Gray scale for text and backgrounds

### **Typography**

- **Primary Font**: Inter (clean, modern)
- **Secondary Font**: Poppins (headings)
- **Monospace**: Roboto Mono (code, numbers)

## 📱 **Responsive Design**

| Breakpoint | Width   | Description    |
| ---------- | ------- | -------------- |
| `sm`       | 640px+  | Small tablets  |
| `md`       | 768px+  | Tablets        |
| `lg`       | 1024px+ | Small desktops |
| `xl`       | 1280px+ | Large desktops |

## 🚀 **Deployment**

### **Vercel (Recommended)**

1. **Build the project**

   ```bash
   npm run build
   ```

2. **Deploy to Vercel**

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel
   ```

3. **Add Environment Variables**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all Firebase configuration variables

### **Other Platforms**

- **Netlify**: Drag and drop `dist` folder
- **Firebase Hosting**: `firebase deploy`
- **GitHub Pages**: Use GitHub Actions

## 🔧 **Available Scripts**

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

## 🧪 **Testing**

```bash
# Run tests (when implemented)
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📋 **Features Roadmap**

### **Version 2.0**

- [ ] WhatsApp Integration
- [ ] SMS Notifications
- [ ] Multi-language Support
- [ ] Advanced Analytics
- [ ] Inventory Management

### **Version 3.0**

- [ ] Mobile App (React Native)
- [ ] AI-Powered Demand Forecasting
- [ ] Integration with Delivery Partners
- [ ] Advanced Reporting Dashboard

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 **Author**

**Pankaj Yadav**

- GitHub: [@theopendraft](https://github.com/theopendraft)
- LinkedIn: [Pankaj Yadav](https://www.linkedin.com/in/pankaj-yadav-5998b3249/)
- Email: py898969@gmail.com

## 🙏 **Acknowledgments**

- [React](https://reactjs.org/) for the amazing framework
- [Firebase](https://firebase.google.com/) for backend services
- [Tailwind CSS](https://tailwindcss.com/) for styling utilities
- [Heroicons](https://heroicons.com/) for beautiful icons
- [Vercel](https://vercel.com/) for hosting platform

## 📞 **Support**

If you have any questions or need help, please:

1. Check the [Issues](https://github.com/theopendraft/mealbox-admin-panel/issues) page
2. Create a new issue with detailed description
3. Contact support at mealbox@gmail.com

---

<div align="center">
  <p>Made with ❤️ for the food delivery industry</p>
  <p>⭐ Star this repo if you find it helpful!</p>
</div>
