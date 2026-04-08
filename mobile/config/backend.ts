import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extras = (Constants.expoConfig || Constants.manifest)?.extra || {};


const defaultLocal = 'http://192.168.1.6:5000';
export const BACKEND_URL = extras.BACKEND_URL || defaultLocal;

export default BACKEND_URL;
