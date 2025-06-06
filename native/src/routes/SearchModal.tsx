import React, { ReactElement, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, Platform } from 'react-native'
import styled from 'styled-components/native'

import { parseHTML, SEARCH_FINISHED_SIGNAL_NAME, SEARCH_ROUTE, SearchResult, useSearch } from 'shared'

import FeedbackContainer from '../components/FeedbackContainer'
import List from '../components/List'
import SearchHeader from '../components/SearchHeader'
import SearchListItem from '../components/SearchListItem'
import useAnnounceSearchResultsIOS from '../hooks/useAnnounceSearchResultsIOS'
import useReportError from '../hooks/useReportError'
import useResourceCache from '../hooks/useResourceCache'
import testID from '../testing/testID'
import sendTrackingSignal from '../utils/sendTrackingSignal'

const Wrapper = styled.View`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: ${props => props.theme.colors.backgroundColor};
`

const SearchCounter = styled.Text`
  margin: 10px 20px;
  color: ${props => props.theme.colors.textSecondaryColor};
`

export type SearchModalProps = {
  documents: SearchResult[]
  fallbackLanguageDocuments: SearchResult[]
  languageCode: string
  cityCode: string
  closeModal: (query: string) => void
  initialSearchText: string
}

const SearchModal = ({
  documents,
  fallbackLanguageDocuments,
  languageCode,
  cityCode,
  closeModal,
  initialSearchText,
}: SearchModalProps): ReactElement | null => {
  const [query, setQuery] = useState<string>(initialSearchText)
  const resourceCache = useResourceCache({ cityCode, languageCode })
  const { t } = useTranslation('search')

  const contentLanguageReturn = useSearch(documents, query)
  const fallbackLanguageReturn = useSearch(fallbackLanguageDocuments, query)
  const searchResults = contentLanguageReturn.data.concat(fallbackLanguageReturn.data)

  useReportError(contentLanguageReturn.error ?? fallbackLanguageReturn.error)
  useAnnounceSearchResultsIOS(searchResults)

  const onClose = (): void => {
    sendTrackingSignal({
      signal: {
        name: SEARCH_FINISHED_SIGNAL_NAME,
        query,
        url: null,
      },
    })
    closeModal(query)
  }

  const renderItem = ({ item }: { item: SearchResult }) => (
    <SearchListItem
      key={item.path}
      title={item.title}
      resourceCache={resourceCache[item.path] ?? {}}
      contentWithoutHtml={parseHTML(item.content)}
      language={languageCode}
      query={query}
      thumbnail={item.thumbnail}
      path={item.path}
    />
  )

  return (
    <Wrapper {...testID('Search-Page')}>
      <SearchHeader query={query} closeSearchBar={onClose} onSearchChanged={setQuery} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {query.length > 0 && (
          <>
            <SearchCounter accessibilityLiveRegion={searchResults.length === 0 ? 'assertive' : 'polite'}>
              {t('searchResultsCount', { count: searchResults.length })}
            </SearchCounter>
            <List
              items={searchResults}
              renderItem={renderItem}
              accessibilityLabel={t('searchResultsCount', { count: searchResults.length })}
              style={{ flex: 1 }}
              keyboardShouldPersistTaps='handled'
              noItemsMessage={
                <FeedbackContainer
                  routeType={SEARCH_ROUTE}
                  language={languageCode}
                  cityCode={cityCode}
                  noResults={searchResults.length === 0}
                  query={query}
                />
              }
            />
          </>
        )}
      </KeyboardAvoidingView>
    </Wrapper>
  )
}

export default SearchModal
