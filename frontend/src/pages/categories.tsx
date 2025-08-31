import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'

export default function Categories() {
  const { t } = useTranslation(['common', 'news'])

  return (
    <>
      <Head>
        <title>{t('common:navigation.categories')} - {t('common:site.title')}</title>
        <meta name="description" content={t('common:navigation.categories')} />
      </Head>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('common:navigation.categories')}
          </h1>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500">
              カテゴリフィルターコンポーネントがここに表示されます
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'ja', ['common', 'news'])),
    },
  }
}