import { useTranslation } from 'react-i18next'

function CrisisHelplines() {
  const { t } = useTranslation()
  return (
    <aside aria-label="Crisis helplines">
      <h2>{t('crisis.heading')}</h2>
      <ul>
        <li>
          <span>{t('crisis.icare_label')}: </span>
          <a href={`tel:${t('crisis.icare_number')}`}>
            {t('crisis.icare_number')}
          </a>
        </li>
        <li>
          <span>{t('crisis.vandrevala_label')}: </span>
          <a href="tel:18602662345">
            {t('crisis.vandrevala_number')}
          </a>
        </li>
      </ul>
    </aside>
  )
}

export default function App() {
  return (
    <div>
      <main>
        {/* Application routes rendered here in later phases */}
      </main>
      <CrisisHelplines />
    </div>
  )
}
