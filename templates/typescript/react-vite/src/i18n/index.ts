import i18n from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"

import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from "@/config/constants"

import enUSCommon from "./locales/en-US/common.json"
import zhCNCommon from "./locales/zh-CN/common.json"

/** 默认命名空间. */
export const DEFAULT_NAMESPACE = "common"

const resources = {
  "zh-CN": { common: zhCNCommon },
  "en-US": { common: enUSCommon },
} as const

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    defaultNS: DEFAULT_NAMESPACE,
    ns: [DEFAULT_NAMESPACE],
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
