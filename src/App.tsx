import {
  IonApp,
  IonRouterOutlet,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import React from 'react';
import { Redirect, Route } from 'react-router-dom';

import Home from './pages/Home';
import ListPage from './pages/ListPage';
import MenuPage from './pages/MenuPage';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils */
import '@ionic/react/css/display.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';

/* Dark Mode (optional) */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => (
<IonApp>
  <IonReactRouter>
    <IonRouterOutlet>
      <Route exact path="/menu" component={MenuPage} />
      <Route exact path="/list" component={ListPage} />
      <Route exact path="/home" component={Home} />
      <Route exact path="/" render={() => <Redirect to="/menu" />} />
    </IonRouterOutlet>
  </IonReactRouter>
</IonApp>

);

export default App;
