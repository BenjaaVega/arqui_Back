
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer'; 
import Landing from './pages/Landing/Landing';
import Login from './pages/Login/Login';
import MainPage from './pages/MainPage/MainPage';
import Profile from './pages/Profile/Profile';
import Wallet from './pages/Wallet/Wallet';
import VisitHistory from './pages/VisitHistory/VisitHistory';
import PurchaseDetail from './pages/PurchaseDetail/PurchaseDetail';
import WebPayReturn from './pages/WebPayReturn/WebPayReturn';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';
import './App.css';


function App() {
  return (
    <Router> 
      <div className="App">
        <Navbar />
        <main className="App-content">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/properties" element={<MainPage />} />
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="/wallet" element={
              <PrivateRoute>
                <Wallet />
              </PrivateRoute>
            } />
            <Route path="/visit-history" element={
              <PrivateRoute>
                <VisitHistory />
              </PrivateRoute>
            } />
            <Route path="/purchases/:purchaseId" element={
              <PrivateRoute>
                <PurchaseDetail />
              </PrivateRoute>
            } />
            <Route path="/webpay/return" element={<WebPayReturn />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;