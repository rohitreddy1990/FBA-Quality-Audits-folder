/* Settings */
const supervisors = ["ssriyans", "summagan", "jmoni", "jpreeth", "hemisas","rincraju","vemuln","girishd"]
const auditorLanguages = {
       
 //   mznmnu : ["US", "CA","UK", "AE", "SA", "EG", "SG"],
// hsswetha: ["US","CA", "UK", "AE", "SA", "EG", "SG"],
//SUP with less audits: 25
    summagan: ["US","CA"],
    daskris: ["US","CA", "UK", "AE", "SA", "EG", "SG"],
    vemuln: ["US","CA"],
    russald: ["US","CA", "UK", "AE", "SA", "EG", "SG"],
    jmoni: ["US","CA"],
    amanjul: ["US","CA"],
    jpreeth: ["US","CA"],
    kalonm: ["US","CA"],
    hemisas: ["US","CA"],
    meelir: ["US","CA"],
    rincraju: ["US","CA"],
    nitepate: ["US","CA"],
    ssriyans: ["US", "CA","UK", "AE", "SA", "EG", "SG"],
    zeeshl: ["US","CA"],
}

const groups = [
    "MFN Andon EGY",
    "MFN Andon SA",
    "MFN Andon SG",
    "MFN Andon UK",
    "Andon-NA-MFN",
    "MFN-TAM-Andon-AE",
    "FBA Andon US",
    "FBA Andon CA",
    "FBA Andon NA Reinstatement",
    
    
    
    /*     "FBA Andon DE",
    "FBA Andon DE Reinstatement",
    "MFN Andon DE",
    "FBA WIR Andon DE",

    "FBA Andon ES",
    "FBA Andon ES Reinstatement",
    "MFN Andon ES",

    "FBA Andon FR",
    "FBA Andon FR Reinstatement",
    "MFN Andon FR",

    "FBA Andon IT",
    "FBA Andon IT Reinstatement",
    "MFN Andon IT",

    "FBA Andon MX",
    "MFN Andon MX", // added

    "FBA Andon UK",
    "FBA Andon UK Reinstatement",
    "MFN Andon UK",

    "FBA Andon BR",
    "Andon-BR-MFN",

    "FBA Andon SE",
    "FBA WIR Andon SE",
    "MFN Andon SE",

    "FBA Andon PL",
    "MFN Andon PL",
    "FBA WIR Andon PL",

    "MFN Andon NL",
    "FBA WIR Andon NL",
    "FBA Andon NL",

    "FBA Andon TR",
    "FBA WIR Andon TR",
    "MFN Andon TR",

    "FBA Andon BE",
    "MFN Andon BE", */
]

const delayEffect = false
//let timeChartsLength = 60 // In charts that display data evolution over time, how many days/weeks do you want to see back from the selected date?
const showOnlyWeekdays = false
const searchFrom = 2023

/* Script */
const iDBName = "touchesDatabase"
const iDBStoreName = "Touches"
const guidRegex = /\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/
const assignedGroups = '("' + groups.join('" OR "') + '")'
const timeChartsLength = 9 // in weeks
const formats = {
    hh_mm: new Intl.DateTimeFormat("en-GB", {
        // 13:15
        hour: "numeric",
        minute: "numeric",
        hour12: false,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
    weekday_MMM_dd_yyyy: new Intl.DateTimeFormat("en-GB", {
        // Tue, Mar 14, 2023
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
    weekday_MMM_dd: new Intl.DateTimeFormat("en-GB", {
        // Tue, Mar 14
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
    MMM_dd: new Intl.DateTimeFormat("en-GB", {
        // Tue, Mar 14
        month: "short",
        day: "numeric",
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
}

const customToolTicketId = "V815694422"
const CUSTOM_AUDIT_NUM_COLUMN_NAME = "minimum-tickets-to-be-audited"
const DEFAULT_AUDIT_NUM = 4

const TAG_NAMES = {
    NO_AUDIT: "do_not_audit",
    DO_AUDIT: "audit_SME", // When SME is added a ticket to be audited that week.
    UNQ_FAIL: "unquarantine_SME", // To be used when SME reviewed the ticket with quarantine fail
    AUDITED: "CS Andon Cord Audited",
    NO_EMAIL: "ASSOCIATE countributed to an audit fail and wasn't coached"
}
const FILE_NAMES = {
    CUSTOM_AUDITS: "custom-audits.csv",
}