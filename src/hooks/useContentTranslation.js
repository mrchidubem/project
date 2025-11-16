// src/hooks/useContentTranslation.js
// React hook for dynamic content translation
// Integrates with TranslationService for user-generated content

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import translationService from '../utils/translationService';

/**
 * Custom hook for translating dynamic content (user-generated text)
 * Separates static UI translations from dynamic content translation
 * 
 * @param {string} content - Content to translate
 * @param {string} sourceLanguage - Source language (default: 'en')
 * @returns {Object} Translation state and utilities
 */
export const useContentTranslation = (content, sourceLanguage = 'en') => {
  const { i18n } = useTranslation();
  const [translatedContent, setTranslatedContent] = useState(content);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState(null);

  const currentLanguage = i18n.language;

  useEffect(() => {
    // If content is empty or language is same as source, no translation needed
    if (!content || currentLanguage === sourceLanguage) {
      setTranslatedContent(content);
      setTranslationError(null);
      return;
    }

    // Translate content
    const translateContent = async () => {
      setIsTranslating(true);
      setTranslationError(null);

      try {
        const translated = await translationService.translateContent(
          content, 
          currentLanguage, 
          sourceLanguage
        );
        setTranslatedContent(translated);
      } catch (err) {
        console.error('Content translation failed:', err);
        setTranslationError(err.message);
        setTranslatedContent(content); // Fallback to original content
      } finally {
        setIsTranslating(false);
      }
    };

    translateContent();
  }, [content, currentLanguage, sourceLanguage]);

  return {
    translatedContent,
    isTranslating,
    translationError,
    originalContent: content,
    isTranslated: currentLanguage !== sourceLanguage && translatedContent !== content
  };
};

/**
 * Hook for translating medication names and descriptions
 * Specialized for medication-related content
 * 
 * @param {Object} medication - Medication object with name and dosage
 * @returns {Object} Translated medication data
 */
export const useMedicationTranslation = (medication) => {
  const { i18n } = useTranslation();
  const [translatedMedication, setTranslatedMedication] = useState(medication);
  const [isTranslating, setIsTranslating] = useState(false);

  const currentLanguage = i18n.language;

  useEffect(() => {
    if (!medication || currentLanguage === 'en') {
      setTranslatedMedication(medication);
      return;
    }

    const translateMedication = async () => {
      setIsTranslating(true);

      try {
        const translatedName = await translationService.translateContent(
          medication.name, 
          currentLanguage, 
          'en'
        );

        // Note: Dosage information should generally not be translated
        // as it contains medical/technical information that should remain precise
        setTranslatedMedication({
          ...medication,
          name: translatedName,
          originalName: medication.name // Keep original for reference
        });
      } catch (err) {
        console.error('Medication translation failed:', err);
        setTranslatedMedication(medication); // Fallback to original
      } finally {
        setIsTranslating(false);
      }
    };

    translateMedication();
  }, [medication, currentLanguage]);

  return {
    translatedMedication,
    isTranslating,
    isTranslated: currentLanguage !== 'en' && translatedMedication?.name !== medication?.name
  };
};

/**
 * Hook for translating ADR (Adverse Drug Reaction) reports
 * Specialized for ADR content translation
 * 
 * @param {Object} adrReport - ADR report object
 * @returns {Object} Translated ADR report data
 */
export const useADRTranslation = (adrReport) => {
  const { i18n } = useTranslation();
  const [translatedReport, setTranslatedReport] = useState(adrReport);
  const [isTranslating, setIsTranslating] = useState(false);

  const currentLanguage = i18n.language;

  useEffect(() => {
    if (!adrReport || currentLanguage === 'en') {
      setTranslatedReport(adrReport);
      return;
    }

    const translateReport = async () => {
      setIsTranslating(true);

      try {
        const translatedDescription = adrReport.description 
          ? await translationService.translateContent(
              adrReport.description, 
              currentLanguage, 
              'en'
            )
          : adrReport.description;

        const translatedSymptoms = adrReport.symptoms
          ? await translationService.translateContent(
              adrReport.symptoms, 
              currentLanguage, 
              'en'
            )
          : adrReport.symptoms;

        setTranslatedReport({
          ...adrReport,
          description: translatedDescription,
          symptoms: translatedSymptoms,
          originalDescription: adrReport.description,
          originalSymptoms: adrReport.symptoms
        });
      } catch (err) {
        console.error('ADR translation failed:', err);
        setTranslatedReport(adrReport); // Fallback to original
      } finally {
        setIsTranslating(false);
      }
    };

    translateReport();
  }, [adrReport, currentLanguage]);

  return {
    translatedReport,
    isTranslating,
    isTranslated: currentLanguage !== 'en'
  };
};

/**
 * Hook for batch translating multiple content items
 * Useful for lists of medications, ADR reports, etc.
 * 
 * @param {Array} items - Array of items to translate
 * @param {Function} translateFn - Function to translate individual items
 * @returns {Object} Batch translation state
 */
export const useBatchTranslation = (items, translateFn) => {
  const [translatedItems, setTranslatedItems] = useState(items);
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!items || items.length === 0) {
      setTranslatedItems([]);
      return;
    }

    const translateBatch = async () => {
      setIsTranslating(true);
      setProgress(0);

      try {
        const translated = [];
        
        for (let i = 0; i < items.length; i++) {
          const translatedItem = await translateFn(items[i]);
          translated.push(translatedItem);
          setProgress(((i + 1) / items.length) * 100);
        }

        setTranslatedItems(translated);
      } catch (err) {
        console.error('Batch translation failed:', err);
        setTranslatedItems(items); // Fallback to original items
      } finally {
        setIsTranslating(false);
        setProgress(100);
      }
    };

    translateBatch();
  }, [items, translateFn]);

  return {
    translatedItems,
    isTranslating,
    progress
  };
};

export default useContentTranslation;