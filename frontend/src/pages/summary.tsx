import { GetStaticProps } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'

export default function Summary() {
  const { t } = useTranslation(['common', 'summary'])

  return (
    <>
      <Head>
        <title>{t('summary:title')} - {t('common:site.title')}</title>
        <meta name="description" content={t('summary:title')} />
      </Head>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('summary:title')}
          </h1>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500">
              日次サマリーコンポーネントがここに表示されます
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
      ...(await serverSideTranslations(locale ?? 'ja', ['common', 'summary'])),
    },
  }
}