/*

Counters:
1. auditedTickets = ["V887694354", "V887785439", ...]
2. assignments = {
    ciimbert: [
        {
            associate: "skragata",
            marketplace: "DE",
            rci: "Inventory Inspection - Coaching Provided",
            ticket: "V891685571"
        },
        {
            associate: "tunakko",
            ticket: "V887785439",
            marketplace: "UK",
            ...
        },
        {
            associate: "eckeljor",
            ticket: "V889144085",
            marketplace: "UK",
            ...
        },
        ...
    ],
    stschol: [
        {
            associate: "tunakko",
            ticket: "V887694354",
            marketplace: "UK",
            ...
        },
        {
            associate: "tunakko",
            ticket: "V887785439",
            marketplace: "UK",
            ...
        },
        {
            associate: "eckeljor",
            ticket: "V889144085",
            marketplace: "UK",
            ...
        },
        ...
    ],
}
3. associateAuditedByCount = {
    ciimbert: {
        parodrid: 1,
        tunakko: 2,
        gonzjulj: 1,
        ...
    },
    stschol: {
        parodrid: 1,
        tunakko: 2,
        gonzjulj: 1,
        ...
    }
}
4. associateCounter = {
    abdeloil: 3,
    alizadar: 3,
    almannaz: 3,
    alvojesi: 3,
    ...
}

*/

// Assigns the tickets to the auditors in a round-robin fashion based on the following criteria: (...)
function randomizerAlgorithm(resolvedByAssociate, auditors, adHocTickets, customAudits, currentWeekName) {
    // console.log("here we are", customAudits)
    const INITIAL_TICKET_NUMBER = 3
    // Define auditors and counters
    const [manualMustAuditTickets, unqFailMustAuditTickets, skipAuditTickets] = adHocTickets
    // console.log("from ra", { manualMustAuditTickets, unqFailMustAuditTickets })
    // TO DO: avoid skipAuditTickets

    const auditorLogins = Object.keys(auditors)
    const associates = Object.keys(resolvedByAssociate)

    const auditedTickets = []

    const assignments = {}
    auditorLogins.forEach(auditor => (assignments[auditor] = []))

    const associateAuditedByCount = {}
    auditorLogins.forEach(auditor => {
        associateAuditedByCount[auditor] = {}
        associates.forEach(associate => {
            associateAuditedByCount[auditor][associate] = 0
        })
    })

    const associateCounter = {}
    associates.forEach(associate => (associateCounter[associate] = 0))

    // 0. Pre-fill counters with must-audit tickets (counters to pre-fill: auditedTickets, assignments, associateAuditedByCount, and associateCounter)
    const associateLoginRegex = /kerberos:([A-Za-z]+)@ANT\.AMAZON\.COM/

    assignMustAuditTickets(manualMustAuditTickets, "manual-must-audit")
    assignMustAuditTickets(unqFailMustAuditTickets, "unq-fail-must-audit")

    function assignMustAuditTickets(tickets, featureName) {
        let currentAuditorIndex = 0

        tickets.forEach(mustAuditTicket => {
            // Get the associate for this mustAuditTicket
            const associate = mustAuditTicket.associate.match(associateLoginRegex)?.[1]
            if (!associate) {
                console.error(`A login cannot be retrieved from ${mustAuditTicket.associate} using the regex /kerberos:([A-Za-z]*)@ANT\.AMAZON\.COM/`)
                return
            }

            // Assign an auditor for this ticket and fill the "assignments" and "associateAuditedByCount" counters
            let isTicketInAssignments = false
            for (let i = 0; i < auditorLogins.length; i++) {
                const auditorIndex = (currentAuditorIndex + i) % auditorLogins.length
                const auditorKey = auditorLogins[auditorIndex]
                // If the auditor speaks the ticket language, assign the ticket
                const extraFeatures = getExtraFeatures({ associate, featureName })
                if (auditors[auditorKey].includes(mustAuditTicket.marketplace)) {
                    assignTicketToAuditor(
                        auditorKey,
                        associate,
                        mustAuditTicket.ticketId,
                        mustAuditTicket.marketplace,
                        mustAuditTicket.rci,
                        extraFeatures
                    )
                    // console.log(`Assigned ticket for ${featureName}`)
                    associateAuditedByCount[auditorKey][associate]++
                    currentAuditorIndex = (auditorIndex + 1) % auditorLogins.length
                    isTicketInAssignments = true
                    break
                }
            }
            // If no auditor can handle the ticket language, assign it to someone anyways
            if (!isTicketInAssignments) {
                const auditorKey = auditorLogins[currentAuditorIndex]
                const extraFeatures = getExtraFeatures({ associate, featureName })
                assignTicketToAuditor(
                    auditorKey,
                    associate,
                    mustAuditTicket.ticketId,
                    mustAuditTicket.marketplace,
                    mustAuditTicket.rci,
                    extraFeatures
                )
                // console.log(`Assigned ticket for ${featureName}`)
                associateAuditedByCount[auditorKey][associate]++
                currentAuditorIndex = (currentAuditorIndex + 1) % auditorLogins.length
            }

            // Fill the "auditedTickets" counter
            auditedTickets.push(mustAuditTicket.ticketId)
        })
    }

    /* TO DO: new criteria
    - Do not audit yourself

    - Selecting the correct topics (
      - RCI: MLDP // rci.includes("Detail Page Updated")
      - RCI: Inventory Coaching
      - Pull Type: Apollo

    - That the quarantine fails gets selected automatically
    // What does this mean?

    */

    /* 1. Do an Apollo, MLDP and No-Inventory if possible. Do this once per associate. */
    // TO DO: Que no sea "No Inventory"
    for (let i = 0; i < associates.length; i++) {
        const associate = associates[i]
        const auditNum = getAssociateAuditNum(customAudits, associate, currentWeekName, INITIAL_TICKET_NUMBER)
        
        // If this associate already has 3 or more tickets audited, skip it
        if (associateCounter[associate] >= auditNum) continue

        const resolvedByThisAssociate = resolvedByAssociate[associate]
        getTicketOfType("pullType.Apollo", associate, resolvedByThisAssociate)
        // console.log("After assigning an Apollo per associate when possible, this is how assignments look like:", associateCounter)
        const allDpTickets = Object.entries(resolvedByThisAssociate.rci)
            .filter(([key]) => key.includes("Detail Page"))
            .reduce((acc, [, tickets]) => acc.concat(tickets), [])
        const dpTicketMarkeplaces = filterMarketplace(resolvedByThisAssociate)
        getTicketOfType("rci.mldp", associate, { rci: { mldp: allDpTickets }, marketplace: dpTicketMarkeplaces })
        //getTicketOfType("rci.'Inventory Inspection - Coaching Provided'", associate, resolvedByAssociate[associate], 0, false)
    }
    // console.log(
        "After assigning an Apollo and an MLDP tickets per associate when possible, this is how assignments look like:",
        associateCounter,
        assignments,
    )

    /* 2. Look for the next 2 (or 3, if no Apollo ticket was found) tickets) */
    randomlyAssignTickets(auditors, resolvedByAssociate)
    // console.log("After assigning tickets trying to meet all requirements, this is how assignments look like:", associateCounter, assignments)

    /* 3. At this point, the tickets of languages not covered by the auditors are not being covered, so some associates don't have tickets audited. Also, some associates only have 2 tickets audited because they only have tickets spoken by one of the auditors. Loop through all associates to ensure they all have 3 tickets audited, even if the auditor has to audit a ticket of an unknown language, or 3 of a single associate. */
    assignLastTickets(associates, resolvedByAssociate, assignments, auditorLogins)


    return assignments


    ///

    function filterMarketplace(resolvedByThisAssociate) {
        const rciDetailPage = Object.entries(resolvedByThisAssociate.rci)
            .filter(([key]) => key.includes("Detail Page"))
            .reduce((acc, [, values]) => {
                acc.push(...values)
                return acc
            }, [])

        return Object.entries(resolvedByThisAssociate.marketplace).reduce((acc, [key, values]) => {
            const filteredValues = values.filter(value => rciDetailPage.includes(value))
            if (filteredValues.length > 0) {
                acc[key] = filteredValues
            }
            return acc
        }, {})
    }

    function assignLastTickets(associates, resolvedByAssociate, assignments, auditorLogins) {
        associates.forEach(associate => {
            const auditNum = getAssociateAuditNum(customAudits, associate, currentWeekName, INITIAL_TICKET_NUMBER)
            const resolvedByAsc = resolvedByAssociate[associate].totalResolved
            const ascAuditedTtNum = associateCounter[associate]
            const ascAuditedTtNumMax = Math.min(auditNum, resolvedByAsc.length)
            //// console.log({ ascAuditedTtNumMax })
            const remainingAuditsNum = ascAuditedTtNumMax - ascAuditedTtNum
            //if (remainingAuditsNum < 1) continue
            for (let i = 0; i < remainingAuditsNum; i++) {
                const auditor = findAuditorWithLeastAudits(assignments, auditorLogins, associate)
                const ticketId = resolvedByAsc.find(ticket => !auditedTickets.includes(ticket))
                if (!ticketId) break

                const marketplace = find("marketplace", ticketId, resolvedByAssociate[associate])
                const rci = find("rci", ticketId, resolvedByAssociate[associate])

                const extraFeatures = getExtraFeatures({ associate })
                assignTicketToAuditor(
                    auditor,
                    associate,
                    ticketId,
                    marketplace,
                    rci,
                    extraFeatures
                )
            }
        })
    }

    function randomlyAssignTickets(auditors, resolvedByAssociate) {
        // console.log("here we are", {resolvedByAssociate})
        for (let i = 0; i <= 10; i++) {
            for (const associate in resolvedByAssociate) {
                const auditor = findAuditorWithLeastAudits(assignments, Object.keys(auditors))
                const auditNum = getAssociateAuditNum(customAudits, associate, currentWeekName, INITIAL_TICKET_NUMBER)

                // If associate has already 3 tickets audited, go to next associate
                if (associateCounter[associate] >= auditNum) {
                    //// console.log(`${associate} has already 3 tickets audited`)
                    continue
                }

                // If associate is the auditor, go to next associate
                if (associate === auditor) {
                    //// console.log(`${associate} is the auditor ${auditor}`)
                    continue
                }

                // If this auditor already audited 2 tickets for this associate, go to next associate // TO DO: should this be > (auditNum/2) instead?
                if (associateAuditedByCount[auditor][associate] >= 2) {
                    //// console.log(`${auditor} already audited 2 tickets for ${associate}`)
                    continue
                }

                let ticketFound = false
                const associateTickets = resolvedByAssociate[associate]

                for (const marketplace in associateTickets.marketplace) {

                    // Check if auditor can audit this marketplace
                    if (!auditors[auditor].includes(marketplace)) {
                        //// console.log(`${auditor} cannot audit a ticket of marketplace ${marketplace}`)
                        continue
                    }

                    const tickets = associateTickets.marketplace[marketplace]
                    for (const ticket of tickets) {

                        // Discard ticket if it's already audited
                        if (auditedTickets.includes(ticket)) {
                            //// console.log(`${ticket} has already been audited`)
                            continue
                        }

                        // Discard ticket if it's "no inventory"
                        if (ticket.rci === "No Inventory") {
                            continue
                        }

                        // Assign ticket to auditor
                        const rci = find("rci", ticket, associateTickets)
                        const extraFeatures = getExtraFeatures({ associate })
                        assignTicketToAuditor(
                            auditor,
                            associate,
                            ticket,
                            marketplace,
                            rci,
                            extraFeatures
                        )
                        ticketFound = true
                        break
                    }
                    if (ticketFound) break
                }
            }
        }
        return assignments
    }

    function getTicketOfType(type, associate, resolvedByThisAssociate, index = 0, discardNoInventory = true) {
        const [ticketTypeCategory, ticketType] = type.split(".")
        
        const currentTicketId = resolvedByThisAssociate[ticketTypeCategory]?.[ticketType]?.[index] ?? null
        if (!currentTicketId) return null
        if (auditedTickets.includes(currentTicketId)) return getTicketOfType(type, associate, resolvedByThisAssociate, index + 1, discardNoInventory)

        // Discard it if it's a "no issue found" one
        if (discardNoInventory && isThisNoInventory(currentTicketId, resolvedByThisAssociate))
            return getTicketOfType(type, associate, resolvedByThisAssociate, index + 1, discardNoInventory)

        // Look for marketplace. If there are available auditors for it, assign it.
        const marketplace = find("marketplace", currentTicketId, resolvedByThisAssociate)
        const spokenBy = findAuditorsByLanguage(marketplace)
        if (spokenBy.length < 1) return getTicketOfType(type, associate, resolvedByThisAssociate, index + 1, discardNoInventory)
        //// console.log(spokenBy, spokenBy.length < 1)
        const auditor = findAuditorWithLeastAudits(assignments, spokenBy, associate)
        if (!auditor) return getTicketOfType(type, associate, resolvedByThisAssociate, index + 1, discardNoInventory)
        //// console.log({ auditor, associate, currentTicketId, marketplace })
        const rci = find("rci", currentTicketId, resolvedByThisAssociate)


        const extraFeatures = getExtraFeatures({ associate, ticketType })
        assignTicketToAuditor(
            auditor,
            associate,
            currentTicketId,
            marketplace,
            rci,
            extraFeatures
        )
    }

    function getAnApolloTicket(associate, resolvedByThisAssociate, index = 0) {
        if (!resolvedByThisAssociate.pullType.Apollo) return null
        else if (!resolvedByThisAssociate.pullType.Apollo[index]) return null
        const currentTicketId = resolvedByThisAssociate.pullType.Apollo[index]
        if (auditedTickets.includes(currentTicketId)) getAnApolloTicket(associate, resolvedByThisAssociate, index + 1)

        // Discard it if it's a "no inventory" one
        if (isThisNoInventory(currentTicketId, resolvedByThisAssociate)) getAnApolloTicket(associate, resolvedByThisAssociate, index + 1)

        // Look for marketplace. If there are available auditors for it, assign it.
        const marketplace = find("marketplace", currentTicketId, resolvedByThisAssociate)
        const spokenBy = findAuditorsByLanguage(marketplace)
        if (spokenBy.length < 1) getAnApolloTicket(associate, resolvedByThisAssociate, index + 1)
        //// console.log(spokenBy, spokenBy.length < 1)
        const auditor = findAuditorWithLeastAudits(assignments, spokenBy, associate)
        if (!auditor) getAnApolloTicket(associate, resolvedByThisAssociate, index + 1)
        //// console.log({ auditor, associate, currentTicketId, marketplace })
        const rci = find("rci", currentTicketId, resolvedByThisAssociate)


        const extraFeatures = getExtraFeatures({ associate, ticketType })
        assignTicketToAuditor(
            auditor,
            associate,
            currentTicketId,
            marketplace,
            rci,
            true,
            extraFeatures
        )
    }

    function find(ticketTypeCategory, ticketId, resolvedByThisAssociate) {
        for (const ticketType in resolvedByThisAssociate[ticketTypeCategory]) {
            if (resolvedByThisAssociate[ticketTypeCategory][ticketType].includes(ticketId)) {
                return ticketType
            }
        }
        console.error(`${ticketTypeCategory} not found`, ticketId, resolvedByThisAssociate)
        return `${ticketTypeCategory} not found`
    }

    function isThisNoInventory(ticketId, resolvedByThisAssociate) {
        const noInventoryRci = "Inventory Inspection - Coaching Provided"
        const output = resolvedByThisAssociate.rci[noInventoryRci] && resolvedByThisAssociate.rci[noInventoryRci].includes(ticketId)
        return output
    }

    function findAuditorsByLanguage(language) {
        // A more efficient, yet slightly less readable alternative: const auditorsList = Object.entries(auditors).reduce((acc, [auditor, langs]) => langs.includes(lang) ? [...acc, auditor] : acc, []);
        const auditorsList = Object.entries(auditors)
            .filter(([auditor, languages]) => languages.includes(language))
            .map(([auditor, languages]) => auditor)
        return auditorsList
    }

    function findAuditorWithLeastAudits(assignments, auditors, associate = "") {
        auditors = auditors.filter(auditor => auditor !== associate)
        if (auditors.length < 1) return null
        if (auditors.length === 1) return auditors[0]
        let minCount = Infinity
        let selectedAuditor = null

        for (const auditor in assignments) {
            if (auditors.includes(auditor) && assignments[auditor].length < minCount) {
                minCount = assignments[auditor].length
                selectedAuditor = auditor
            }
        }
        return selectedAuditor
    }

    function assignTicketToAuditor(auditor, associate, ticket, marketplace, rci, extraFeatures = []) {
        if (!auditor) return
        if (auditor === associate) console.error(`For ticket ${ticket}, auditor "${auditor}" equals associate "${associate}".`)
        auditedTickets.push(ticket)
        assignments[auditor].push({ associate, ticket, marketplace, rci, extraFeatures })
        associateCounter[associate]++
        associateAuditedByCount[auditor][associate]++
    }

    function getAssociateAuditNum(customAudits, associate, currentWeekName, INITIAL_TICKET_NUMBER) {
        const associateData = customAudits.find(({ week, login }) => login === associate && week === currentWeekName)
        const associateAuditNum = associateData?.[CUSTOM_AUDIT_NUM_COLUMN_NAME] || INITIAL_TICKET_NUMBER
        const actualAssociateAuditNum = Math.max(Number(associateAuditNum), INITIAL_TICKET_NUMBER)
        return actualAssociateAuditNum
    }
    function isExtra(associate) {
        return associateCounter[associate] >= INITIAL_TICKET_NUMBER
    }
    function getExtraFeatures({ associate, ticketType, featureName }) {
        const isThisExtra = isExtra(associate)
        return [
            isThisExtra ? "extra" : "",
            ticketType === "Apollo" ? "apollo" : "",
            featureName || "",
        ].filter(Boolean)
    }
}
