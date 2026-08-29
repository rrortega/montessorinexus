export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const ALL_SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'es', name: 'Español', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'Inglés', nativeName: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Portugués', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'fr', name: 'Francés', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Alemán', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ru', name: 'Ruso', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'ca', name: 'Catalán', nativeName: 'Català', flag: '🇦🇩' },
];

export const getLanguageByCode = (code: string): SupportedLanguage => {
  return (
    ALL_SUPPORTED_LANGUAGES.find(l => l.code === code.toLowerCase()) || {
      code,
      name: code.toUpperCase(),
      nativeName: code.toUpperCase(),
      flag: '🌐'
    }
  );
};
