import 'core-js/actual/array/at'
import { Settings as LuxonSettings } from 'luxon'
import React, { ReactElement, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter as Router } from 'react-router-dom'
import { ThemeProvider, createGlobalStyle } from 'styled-components'

import { setJpalTrackingCode } from 'shared/api'
import { UiDirectionType, config } from 'translations'

import RootSwitcher from './RootSwitcher'
import Helmet from './components/Helmet'
import I18nProvider from './components/I18nProvider'
import TtsContainer from './components/TtsContainer'
import buildConfig from './constants/buildConfig'
import safeLocalStorage, { JPAL_TRACKING_CODE_KEY } from './utils/safeLocalStorage'
import { initSentry } from './utils/sentry'

const GlobalStyle = createGlobalStyle`
    body {
        position: relative;

        /* Styling for react-tooltip: https://react-tooltip.com/docs/getting-started#styling */
        --rt-color-dark: ${props => props.theme.colors.textSecondaryColor};
        --rt-color-white: ${props => props.theme.colors.backgroundColor};
        --rt-opacity: 1;
    }
`

LuxonSettings.throwOnInvalid = true
LuxonSettings.defaultLocale = config.defaultFallback

const App = (): ReactElement => {
  const [contentLanguage, setContentLanguage] = useState<string>(config.defaultFallback)
  const { t } = useTranslation('landing')

  const contentDirection = contentLanguage
    ? config.getScriptDirection(contentLanguage)
    : (getComputedStyle(document.body).direction as UiDirectionType)

  useEffect(() => {
    initSentry()
    setJpalTrackingCode(safeLocalStorage.getItem(JPAL_TRACKING_CODE_KEY))
  }, [])

  return (
    <ThemeProvider theme={{ ...buildConfig().lightTheme, contentDirection }}>
      <I18nProvider contentLanguage={contentLanguage}>
        <>
          <Helmet pageTitle={t('pageTitle')} rootPage />
          <Router>
            <GlobalStyle />
            <TtsContainer languageCode={contentLanguage}>
              <RootSwitcher setContentLanguage={setContentLanguage} />
            </TtsContainer>
          </Router>
        </>
      </I18nProvider>
    </ThemeProvider>
  )
}

export default App
