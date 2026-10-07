import { bootstrapApplication } from '@angular/platform-browser';
// import { appConfig } from './app/app.config';
import { App } from './UserManagement/app';
// import { App } from './app/app';
// import { MainClass } from './UserManagement/Maincomponent';
import { appConfig } from './UserManagement/app.config';
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
