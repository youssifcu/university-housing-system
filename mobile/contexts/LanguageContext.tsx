import React, { createContext, useContext, useState, ReactNode } from 'react';
import { I18nManager } from 'react-native';

export type Language = 'en' | 'ar';

const translations: Record<Language, Record<string, string>> = {
  en: {
    loginTitle: 'Dorm System',
    loginSubtitle: 'University Housing Management',
    studentEmail: 'Student Email',
    password: 'Password',
    rememberMe: 'Remember Me',
    forgotPassword: 'Forgot Password?',
    loginButton: 'Login to Dashboard',
    createAccount: 'Create New Student Account',
    // forgot screen
    resetTitle: 'Reset Password',
    resetSubtitle: 'Enter your university email to receive a link.',
    sendReset: 'Send Reset Link',
    backToLogin: 'Back to Login',
    // validation messages
    emailRequired: 'University email is required',
    invalidEmail: 'Please enter a valid email address',
    passwordRequired: 'Password is required',
    passwordComplexity: 'Password must be at least 8 characters and include an uppercase letter, a number and a special character',
    // common
    switchLanguage: 'العربية',
  },
  ar: {
    loginTitle: 'نظام السكن',
    loginSubtitle: 'إدارة السكن الجامعي',
    studentEmail: 'البريد الإلكتروني للطالب',
    password: 'كلمة المرور',
    rememberMe: 'تذكرني',
    forgotPassword: 'نسيت كلمة المرور؟',
    loginButton: 'تسجيل الدخول',
    createAccount: 'إنشاء حساب جديد',
    resetTitle: 'إعادة تعيين كلمة المرور',
    resetSubtitle: 'أدخل بريدك الإلكتروني الجامعي لتلقي الرابط.',
    sendReset: 'إرسال الرابط',
    backToLogin: 'العودة لتسجيل الدخول',
    // validation messages
    emailRequired: 'البريد الإلكتروني مطلوب',
    invalidEmail: 'يرجى إدخال عنوان بريد إلكتروني صالح',
    passwordRequired: 'كلمة المرور مطلوبة',
    passwordComplexity: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل وتحتوي على حرف كبير ورقم ورمز خاص',
    switchLanguage: 'English',
  },
};

interface LanguageContextValue {
  language: Language;
  toggle: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  toggle: () => {},
  t: (k: string) => k,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const toggle = () => {
    const next = language === 'en' ? 'ar' : 'en';
    setLanguage(next);
    // force rtl for arabic; reload required in a real app
    I18nManager.forceRTL(next === 'ar');
  };

  const t = (key: string) => translations[language][key] ?? key;

  return (
    <LanguageContext.Provider value={{ language, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
