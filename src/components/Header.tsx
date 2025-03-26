import { IonHeader, IonToolbar } from '@ionic/react';
import React, { useEffect, useState } from 'react';
import './Header.css';

type HeaderProps = {
  title: string;
};

const Header: React.FC<HeaderProps> = ({ title }) => {
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const userName = '山田太郎'; // ← ログイン連携に置き換え可

  return (
    <IonHeader>
      <IonToolbar>
        <div className="header-content">
          <div className="header-left">
            <img src="/logo-square.png" alt="logo" className="logo-image" />
            <span className="page-title">{title}</span>
          </div>
          <div className="header-right">
            <div className="time">{currentTime}</div>
            <div className="user-name">ユーザー名：{userName}</div>
          </div>
        </div>
      </IonToolbar>
    </IonHeader>
  );
};

export default Header;
