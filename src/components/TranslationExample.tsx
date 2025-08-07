import { useTranslation } from 'react-i18next';

// This is an example component showing how to implement translations
// You can use this pattern in any component where you want Vietnamese support

const TranslationExample = () => {
  const { t } = useTranslation();

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Translation Example</h3>
      <p className="text-gray-700 mb-2">
        Current Navigation: {t('nav.home')} | {t('nav.contact')}
      </p>
      <p className="text-gray-700">
        Hero Title: {t('hero.title')}
      </p>
    </div>
  );
};

export default TranslationExample;