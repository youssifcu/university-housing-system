import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extras = (Constants.expoConfig || Constants.manifest)?.extra || {};


const defaultLocal = Platform.OS === 'android' ? 'http:10.81.152.117:5000' : 'http://localhost:5000';
export const BACKEND_URL = extras.BACKEND_URL || defaultLocal;

export default BACKEND_URL;
