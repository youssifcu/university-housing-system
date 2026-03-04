import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebaseConfig';
import Button from '../components/Button';
import '../styles/RegisterPage.css';
import '../styles/DashboardPage.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          console.log(currentUser);
          const userDoc = await getDoc(doc(db, 'users', currentUser.email));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(userData.fullName || 'User');
          } else {
            console.log('User document does not exist');
            setUserName('User');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserName('User');
        }
      } else {
        navigate('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
    
  }, [userName]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="register-page">
        <div className="loading-message">Loading...</div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="dashboard-container">
        <div className="logo-section">
          <div className="logo-placeholder">🎓</div>
          <h1 className="page-title">Student Accommodation</h1>
        </div>
        
        <div className="dashboard-content">
          <h2>Hello, {userName}!</h2>
          <p>Welcome to your dashboard</p>
          
          <div className="dashboard-actions">
            <Button 
              variant="primary" 
              onClick={handleLogout}
              className="logout-button"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
