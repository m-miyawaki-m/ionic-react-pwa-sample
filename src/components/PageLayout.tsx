import { IonPage } from '@ionic/react';
import React from 'react';
import Body from './Body/Body';
import Footer from './Footer';
import Header from './Header';
import './PageLayout.css';

type Props = {
  title: string;
};

const PageLayout: React.FC<Props> = ({ title }) => {
  return (
    <IonPage>
      <div className="page-layout">
        <Header title={title} />
        <main className="page-body">
          <Body />
        </main>
        <Footer />
      </div>
    </IonPage>
  );
};

export default PageLayout;
