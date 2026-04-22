import { Language } from '@/types';

const translations = {
  en: {
    // Landing
    welcomeTitle: 'Chatbot Dashboard',
    welcomeSubtitle: 'Welcome — upload a database to get started',
    welcomeDescription: 'Analyse your chatbot handover data with interactive charts, tables, and insights. Supports SQLite (.db, .sqlite), SQL dumps (.sql) and CSV (.csv) — including large files.',
    dropzoneTitle: 'Drop your database file here',
    dropzoneOr: 'or click to browse',
    dropzoneFormats: 'Supports SQLite (.db, .sqlite) and CSV (.csv)',
    uploading: 'Processing…',
    uploadError: 'Could not read file. Make sure it is a valid SQLite or CSV file.',

    // Nav
    dashboard: 'Dashboard',
    tables: 'Tables',
    newFile: 'New File',
    language: 'Language',

    // Dashboard
    overview: 'Overview',
    handovers: 'Handovers',
    totalRecords: 'Total Records',
    totalTables: 'Tables',
    totalColumns: 'Columns',
    dateRange: 'Date Range',
    noDate: 'No date column',
    recentData: 'Recent Data',
    noCharts: 'No charts could be generated for this dataset.',
    loadingCharts: 'Analysing database…',
    rows: 'rows',
    showingRows: 'Showing first',
    of: 'of',

    // Chatbot metrics
    totalHandovers: 'Total Handovers',
    resolvedRate: 'Resolution Rate',
    avgDuration: 'Avg. Duration',
    topReason: 'Top Reason',
    topChannel: 'Top Channel',
    topAgent: 'Top Agent',

    // Charts
    handoversOverTime: 'Handovers Over Time',
    handoversByReason: 'Handovers by Reason',
    handoversByChannel: 'Handovers by Channel',
    handoversByAgent: 'Handovers by Agent',
    handoversByStatus: 'Handovers by Status',
    distributionOf: 'Distribution of',
    countOver: 'Count Over Time',
    countBy: 'Count by',
    count: 'Count',
    value: 'Value',

    // Tables page
    tablesOverview: 'Database Tables',
    tablesDescription: 'Explore the structure of your database',
    tableName: 'Table',
    rowCount: 'Rows',
    columnCount: 'Columns',
    selectTable: 'Select a table to view its structure',
    columnName: 'Column',
    columnType: 'Type',
    sqlType: 'SQL Type',
    inferredType: 'Inferred Type',
    nullable: 'Nullable',
    uniqueValues: 'Unique Values',
    sampleValues: 'Sample Values',
    yes: 'Yes',
    no: 'No',

    // Types
    typeDate: 'Date',
    typeNumber: 'Number',
    typeCategory: 'Category',
    typeBoolean: 'Boolean',
    typeText: 'Text',
  },
  nl: {
    // Landing
    welcomeTitle: 'Chatbot Dashboard',
    welcomeSubtitle: 'Welkom — upload een database om te beginnen',
    welcomeDescription: 'Analyseer uw chatbot handover data met interactieve grafieken, tabellen en inzichten. Ondersteunt SQLite (.db, .sqlite), SQL-dumps (.sql) en CSV (.csv) — inclusief grote bestanden.',
    dropzoneTitle: 'Sleep uw databasebestand hierheen',
    dropzoneOr: 'of klik om te bladeren',
    dropzoneFormats: 'Ondersteunt SQLite (.db, .sqlite) en CSV (.csv)',
    uploading: 'Verwerken…',
    uploadError: 'Kon het bestand niet lezen. Zorg ervoor dat het een geldig SQLite- of CSV-bestand is.',

    // Nav
    dashboard: 'Dashboard',
    tables: 'Tabellen',
    newFile: 'Nieuw Bestand',
    language: 'Taal',

    // Dashboard
    overview: 'Overzicht',
    handovers: 'Handovers',
    totalRecords: 'Totaal Records',
    totalTables: 'Tabellen',
    totalColumns: 'Kolommen',
    dateRange: 'Datumbereik',
    noDate: 'Geen datumkolom',
    recentData: 'Recente Data',
    noCharts: 'Er konden geen grafieken worden gegenereerd voor deze dataset.',
    loadingCharts: 'Database analyseren…',
    rows: 'rijen',
    showingRows: 'Eerste',
    of: 'van',

    // Chatbot metrics
    totalHandovers: 'Totaal Handovers',
    resolvedRate: 'Oplossingspercentage',
    avgDuration: 'Gem. Duur',
    topReason: 'Toprede',
    topChannel: 'Topkanaal',
    topAgent: 'Topmedewerker',

    // Charts
    handoversOverTime: 'Handovers in de Tijd',
    handoversByReason: 'Handovers per Reden',
    handoversByChannel: 'Handovers per Kanaal',
    handoversByAgent: 'Handovers per Medewerker',
    handoversByStatus: 'Handovers per Status',
    distributionOf: 'Verdeling van',
    countOver: 'Aantal Over Tijd',
    countBy: 'Aantal per',
    count: 'Aantal',
    value: 'Waarde',

    // Tables page
    tablesOverview: 'Databasetabellen',
    tablesDescription: 'Verken de structuur van uw database',
    tableName: 'Tabel',
    rowCount: 'Rijen',
    columnCount: 'Kolommen',
    selectTable: 'Selecteer een tabel om de structuur te bekijken',
    columnName: 'Kolom',
    columnType: 'Type',
    sqlType: 'SQL-type',
    inferredType: 'Afgeleid Type',
    nullable: 'Nullable',
    uniqueValues: 'Unieke Waarden',
    sampleValues: 'Voorbeeldwaarden',
    yes: 'Ja',
    no: 'Nee',

    // Types
    typeDate: 'Datum',
    typeNumber: 'Getal',
    typeCategory: 'Categorie',
    typeBoolean: 'Boolean',
    typeText: 'Tekst',
  },
};

export type TranslationKey = keyof typeof translations.en;

export function t(lang: Language, key: TranslationKey): string {
  return translations[lang][key] ?? translations.en[key] ?? key;
}

export default translations;
