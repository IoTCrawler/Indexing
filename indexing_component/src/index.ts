import { App } from './app';
import {env} from './util/validateEnv';

const app = new App(Number(env.PORT));
app.listen();