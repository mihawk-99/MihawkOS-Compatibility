// SPDX-License-Identifier: GPL-3.0-or-later
// Every language other than English in one object, for scripts/i18n.test.mjs. The pages do not import this file: each
// loads only its visitor's language from src/i18n/ (src/i18n.jsx), about 3 KB instead of 25.
import frFR from './i18n/fr-FR.js';
import esES from './i18n/es-ES.js';
import deDE from './i18n/de-DE.js';
import itIT from './i18n/it-IT.js';
import ruRU from './i18n/ru-RU.js';
import zhCN from './i18n/zh-CN.js';
import jaJP from './i18n/ja-JP.js';
import ptBR from './i18n/pt-BR.js';
import plPL from './i18n/pl-PL.js';

export default { 'fr-FR': frFR, 'es-ES': esES, 'de-DE': deDE, 'it-IT': itIT, 'ru-RU': ruRU, 'zh-CN': zhCN, 'ja-JP': jaJP, 'pt-BR': ptBR, 'pl-PL': plPL };
