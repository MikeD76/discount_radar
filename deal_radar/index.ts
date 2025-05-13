import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './src/App';
import { expo } from './app.json';

AppRegistry.registerComponent(expo.name, () => App);