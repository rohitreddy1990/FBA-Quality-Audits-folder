// To do: check why featureNames are not being shown
var non_Remediated_RCIs = ['DefCon-Manufacturing Defect-FBA Amnesty Received','DefCon-Refund/Return Issues-Out of Scope','DefCon-Shipment Delay-Out of Scope','Defective - Non-Testable','Duplicate Pull','Inappropriate - Customer Misunderstanding/Preference','Inappropriate - Pricing error','Inappropriate - Smell/Taste','Inappropriate Pull','Inappropriate Pull - No details found for Investigation','Incorrect routing','Inventory Inspection - Coaching Provided','No Inventory','Other Reinstatement Request - Not Approved','Size/Fit','Size/Fit - Case Re-opened','Unver-Defect Not Confirmed-BC Clean- Coaching-Expiration','Unver-Defect Not Confirmed-BC Clean- Coaching-Item-Parts-Missing','Unver-Defect Not Confirmed-BC Clean- Coaching-MLDP-WIR','Unver-Manufacturing Defect-Not-Confirmed'];
var remediated_RCIs = remediated_RCIs = [/*'Damage Seller Coaching',*/'CS Andon POA Approved','Detail Page - Images','Detail Page Updated - FBA','Detail Page Updated - Seller','Expiration Date - Receiving Error','Expiration Date - Seller Label Error','Expiration Date – Receiving Error','Expiration Date ASIN Updated – FBA','Expiration Date ASIN Updated – Amazon','Issue Found - Other','Mislabel - Amazon Fault','Mislabel - Barcode Issue','Mislabel - Item Parts Missing','Mislabel - Quantity Issue','Mislabel - Seller Fault','Mislabel â€“ Item Parts Missing','No POA - Amnesty exception','Other Reinstatement Request - Approved','POA Received','POA Received - DP Update','POA Received - Inventory Correction','POA Received - Test Report Provided','Size/Fit - PDP','DefCon-Detail Page Content-Incorrect/Misleading Image-3P-Bouncer','Bin Check Expansion - Requested','Bin Check Expansion - Completed', 'DefCon-Offer Discontinued / Unresponsive Vendor/Seller'];
// Conditions
const excluded = [
    // These tickets are excluded from being audited, even if that means that an
    // associate will be left with less than the set number of audits.

    // Tickets with tag 'do_not_audit'
    ticket => !ticket.skipAudit,
    ticket => !remediated_RCIs.includes(ticket.rci),
]

const unprioritized = [
    // These tickets can be audited, but they are 'at the end of the list' and they
    // will only be selected as a last resort

    // Tickets of marketplaces that don't match any of the auditor languages
    (ticket, auditorLanguages) => !auditorLanguages.includes(ticket.marketplace),

    // Tickets with 'no defect found' root cause
    ticket => ticket.rci && ticket.rci.includes("Defect Not Confirmed"),
]

const must = [
    // All the tickets meeting these conditions will be audited with no exception
    // (even if they surpass the maximum number of audits for the associate).
    
    // Tickets with tag 'audit_SME'
    {
        condition: ticket => ticket.mustAuditManual,
        featureName: "manual-must-audit",
    },

    // Tickets with tag 'unquarantine_SME'
    {
        condition: ticket => ticket.mustAuditUnqFail,
        featureName: "unq-fail-must-audit",
    },
]

const oneOfEach = [
    // At least one ticket meeting these conditions will be audited for every
    // associate, as long as the maximum number of audits for the associate is not
    // surpassed, following the order of priority of the conditions.
    // An Apollo ticket
    {
        condition: ticket => non_Remediated_RCIs.includes(ticket.rci),
        featureName: "Non Remediated",
    },

    //An detail page images ticket
    {
        condition: ticket => ticket.rci && ticket.rci.includes("Detail Page - Images"),
        featureName: "mldp",
    }, 
]


/*This JavaScript function, [initializeCounter](cci:1://c:\Users\amrohtm\Desktop\Quality Audits folder\randomizer.js:59:0-64:1), takes in two parameters: keys (an array of keys) and initialValue (a value to initialize each key in the counter object to).

It creates an empty counter object and then iterates over each key in the keys array. For each key, it sets the value of that key in the counter object to the initialValue.

Finally, it returns the counter object.

 */

 // Other funcitons
function initializeCounter(keys, initialValue) {
    const counter = {}
    keys.forEach(key => (counter[key] = initialValue))
    return counter
}


/*This JavaScript function, [shuffleAndReorderTicketList](cci:1://c:\Users\amrohtm\Desktop\Quality Audits folder\randomizer.js:75:0-89:1), takes in two parameters: completeTicketList (an array of tickets) and auditors (an object containing auditors and their languages).

It first removes tickets that are excluded based on certain conditions defined in the excluded array.

Then, it shuffles the remaining tickets in a deterministic way using the deterministicShuffle function, with a seed of 673427.

Next, it creates an array of auditor languages by flattening and removing duplicates from the values of the auditors object.

Finally, it reorders the shuffled tickets by filtering them based on conditions defined in the unprioritized array. Tickets that meet the conditions are placed at the end of the list.

The function returns the reordered and filtered list of tickets.*/
function shuffleAndReorderTicketList(completeTicketList, auditors) {
    // Remove excluded tickets
    const withoutExcluded = excluded.reduce((acc, curr) => acc.filter(curr), completeTicketList)

    // Shuffle in a deterministic way
    const shuffled = deterministicShuffle(withoutExcluded, 673427)

    // Put unprioritized at the end
    const auditorLanguages = [...new Set(Object.values(auditors).flat())]
    return unprioritized.reduce((acc, curr) => {
        const filtered = acc.filter(item => curr(item, auditorLanguages));
        const notFiltered = acc.filter(item => !curr(item, auditorLanguages));
        return notFiltered.concat(filtered)
    }, shuffled)
}

// Main

/*This JavaScript function, [randomizerAlgorithm](cci:1://c:\Users\amrohtm\Desktop\Quality Audits folder\randomizer.js:104:0-269:1), is a complex algorithm that takes in several parameters: completeTicketList, auditors, associates, and currentCustomAudits. It generates a curated list of tickets, with a deterministic shuffle and with certain conditions applied.

Here's a high-level overview of what the function does:

It calls the shuffleAndReorderTicketList function to get a curated list of tickets, with a deterministic shuffle and with conditions "excluded" and "unprioritized" applied.
It initializes counters for assignments and associate audits.
It defines a method checkReachedAssociateLimit to check if an associate has reached their maximum number of audits.
It defines a method assignTicketToAuditor to assign a ticket to an auditor.
It defines a method getAuditor to select an auditor based on certain conditions.
It defines a method selectAuditor to select an auditor based on a ticket's language.
It runs conditions on the curated list of tickets and assigns tickets to auditors based on certain conditions.
It assigns tickets to auditors for associates who have not yet been assigned tickets.
It returns the assignments.
This function is a complex algorithm that generates a randomized list of tickets and assigns them to auditors based on certain conditions.

*/
function randomizerAlgorithm(completeTicketList, auditors, associates, currentCustomAudits) {

    // Get a curated list of tickets, with a deterministic shuffle and with the
    // conditions "excluded" and "unprioritized" applied
    let shuffledTicketList = shuffleAndReorderTicketList(completeTicketList, auditors)

    //
    const auditorEntries = Object.entries(auditors)
    const auditorLogins = Object.keys(auditors)
    // const associates = Object.keys(resolvedByAssociate)

    // Initialize counters
    const assignments = {} // initializeCounter(auditorLogins, [])
    const associateCounter = initializeCounter(associates, 0)
    const auditedTickets = []

    // Define methods

    /**/
    const checkReachedAssociateLimit = (associate) => {
        const currentAssociateAudits = associateCounter[associate]

        const associateCustomAudit = currentCustomAudits.find(currentCustomAudit => currentCustomAudit.login === associate)

        const maxAssociateAudits = associateCustomAudit
            ? Number(associateCustomAudit[CUSTOM_AUDIT_NUM_COLUMN_NAME])
            : DEFAULT_AUDIT_NUM

        return currentAssociateAudits >= maxAssociateAudits
    }

    /*This JavaScript function, [assignTicketToAuditor](cci:1://c:\Users\amrohtm\Desktop\Quality Audits folder\randomizer.js:151:4-181:5), assigns a ticket to an auditor. It takes in three parameters: auditor, ticket, and extraFeatures.

The function first checks if an auditor is provided. If not, it logs an error message and returns.

If an auditor is provided, it checks if the auditor is the same as the associate associated with the ticket. If they are the same, it logs an error message and returns.

Next, it adds any extra features to the ticket object.

Then, it assigns the ticket to the auditor by pushing the ticket object into the assignments array for that auditor. It also increments the associateCounter for the associate associated with the ticket.

Finally, it removes the assigned ticket from the shuffledTicketList array.

The function returns nothing.

This function is likely part of a larger algorithm that assigns tickets to auditors based on certain conditions.*/
    const assignTicketToAuditor = (auditor, ticket, extraFeatures = []) => {
        // ticket = { associate, ticketId, marketplace, rci, extraFeatures }
        if (!auditor) {
            console.error(`No auditor was found for ticket ${ticket.ticketId}`)
            // user feedback
            return
        }

        if (auditor === ticket.associate) {
            console.error(`For ticket ${ticket.ticketId}, auditor "${auditor}" equals associate "${ticket.associate}".`)
            // to do: just change the auditor?
            return
        }

        // Add extraFeatures
        ticket.extraFeatures = [
            ticket.pullType === "Apollo" ? "apollo" : "",
            // to do: add mldp and others
            ...extraFeatures,
        ].filter(Boolean)

        // Assign ticket
        auditedTickets.push(ticket.ticketId)
        assignments[auditor] ??= []
        assignments[auditor].push({ ...ticket, ticket: ticket.ticketId })

        associateCounter[ticket.associate]++
        // associateAuditedByCount[auditor][ticket.associate]++

        shuffledTicketList = shuffledTicketList.filter(({ ticketId }) => ticketId !== ticket.ticketId)
    }

    /*This code defines a function named [withLeastAudits](cci:1://c:\Users\amrohtm\Desktop\Quality Audits folder\randomizer.js:200:8-212:9) that takes an array of auditors as input. It returns the auditor with the least number of audits. If there's only one auditor in the list, that auditor is returned.*/
    // Selecting an auditor
    const getAuditor = {
        withLeastAudits: (auditors) => {
            // If there's only one auditor to choose from, return it
            if (auditors.length === 1) {
                return auditors[0]
            }

            // Get the auditor with the least audits
            const [selectedAuditor] = auditors
                .map(auditor => [auditor, assignments[auditor]?.length ?? 0])
                .reduce((min, curr) => curr[1] < min[1] ? curr : min, ["", Infinity])

            return selectedAuditor
        },
        speakingLanguage: (ticketLanguage, auditors) => {
            // Get the suitable auditors for this ticket
            const auditorsSpeakingTargetLanguage = auditorEntries
                .filter(([auditor, languages]) => {
                    const isOneOfTheAuditors = auditors && auditors.includes(auditor)
                    const doesAuditorSpeakLanguage = languages.includes(ticketLanguage)
                    return isOneOfTheAuditors && doesAuditorSpeakLanguage
                })

            // If no auditor speaks the ticket language, choose from all auditors
            const auditorEntriesToChooseFrom = auditorsSpeakingTargetLanguage.length < 1
                ? auditorEntries
                : auditorsSpeakingTargetLanguage

            // Get only the auditor names
            return auditorEntriesToChooseFrom.map(([auditor]) => auditor)
        }
    }

/**/

    const selectAuditor = (ticketLanguage, auditors) => {
        // Get the suitable auditors for this ticket
        const auditorsToChooseFrom = getAuditor.speakingLanguage(ticketLanguage, auditors)

        // Get the one with least audits
        return getAuditor.withLeastAudits(auditorsToChooseFrom)
    }

    // Run conditions
    must.forEach(condition => {
        const ticketsWithCondition = shuffledTicketList.filter(condition.condition)

        ticketsWithCondition.forEach(ticket => {
            const auditor = selectAuditor(ticket.marketplace)

            const extraFeatures = [condition.featureName]
            const reachedAssociateLimit = checkReachedAssociateLimit(ticket.associate)
            if (reachedAssociateLimit) {
                extraFeatures.push("extra")
            }
            assignTicketToAuditor(auditor, ticket, extraFeatures)
        })
    })

    oneOfEach.forEach(condition => {
        const associatesAssigned = []
        shuffledTicketList.forEach(ticket => {
            // Filter out tickets that don't meet the condition
            if (!condition.condition(ticket)) {
                return
            }

            const { associate } = ticket

            // Only assigning up to one ticket by associate in this condition type
            const hasAuditedTicket = associatesAssigned.includes(associate)
            if (hasAuditedTicket) {
                // console.log(`Associate ${associate} already has an audited ticket.`)
                return
            }

            // Check if the associate has reached their maximum number of assignments
            const reachedAssociateLimit = checkReachedAssociateLimit(associate)
            if (reachedAssociateLimit) {
                return
            }

            const auditor = selectAuditor(ticket.marketplace)
            assignTicketToAuditor(auditor, ticket, [condition.featureName])
            associatesAssigned.push(associate)
        })

    })

    // Assign the remaining audits for every associate
    shuffledTicketList.forEach(ticket => {
        const { associate } = ticket

        // Check if the associate has reached their maximum number of assignments
        const reachedAssociateLimit = checkReachedAssociateLimit(associate)
        if (reachedAssociateLimit) {
            return
        }

        // to do: use another method to select the auditor, that rotates the auditors for an associate
        const auditor = selectAuditor(ticket.marketplace)
        assignTicketToAuditor(auditor, ticket)
    })
    
    return assignments
}