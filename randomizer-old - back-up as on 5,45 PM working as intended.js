// Randomizer algorithm

// Assigns the tickets to the auditors in a round-robin fashion based on the following criteria: (...)
function randomizerAlgorithm_old(resolvedByAssociate, auditors, adHocTickets, customAudits, currentWeekName) {
    // console.log({
    //     resolvedByAssociate, auditors, adHocTickets, customAudits, currentWeekName
    // })

    // console.log("here we are", customAudits)
    const INITIAL_TICKET_NUMBER = 4
    const supList = ["ssriyans", "summagan", "jmoni", "jpreeth", "hemisas","rincraju","vemuln","girishd"];
    let supLimit = 25;
    let anySUPLeft = true;

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
                    console.log(`Assigned ticket for ${featureName}`)
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
   //     getTicketOfType("pullType.Apollo", associate, resolvedByThisAssociate)
        // console.log("After assigning an Apollo per associate when possible, this is how assignments look like:", associateCounter)
        const allDpTickets = Object.entries(resolvedByThisAssociate.rci)
            .filter(([key]) => key.includes("Detail Page"))
            .reduce((acc, [, tickets]) => acc.concat(tickets), [])
        const dpTicketMarkeplaces = filterMarketplace(resolvedByThisAssociate)
  //      getTicketOfType("rci.mldp", associate, { rci: { mldp: allDpTickets }, marketplace: dpTicketMarkeplaces })
        //getTicketOfType("rci.'Inventory Inspection - Coaching Provided'", associate, resolvedByAssociate[associate], 0, false)
    }
    // console.log(
    //     "After assigning an Apollo and an MLDP tickets per associate when possible, this is how assignments look like:",
    //     associateCounter,
    //     assignments,
    // )

    /* 2. Look for the next 2 (or 3, if no Apollo ticket was found) tickets) */
    console.log(assignments);
    randomlyAssignTickets(auditors, resolvedByAssociate)
    console.log(assignments);
    // console.log("After assigning tickets trying to meet all requirements, this is how assignments look like:", associateCounter, assignments)

    /* 3. At this point, the tickets of languages not covered by the auditors are not being covered, so some associates don't have tickets audited. Also, some associates only have 2 tickets audited because they only have tickets spoken by one of the auditors. Loop through all associates to ensure they all have 3 tickets audited, even if the auditor has to audit a ticket of an unknown language, or 3 of a single associate. */
    assignLastTickets(associates, resolvedByAssociate, assignments, auditorLogins)
    console.log(assignments);


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
        // console.log("here we are", { resolvedByAssociate })

        //new code
        var CounterForAuditor = [];
        var objCounterForAuditors = {};

        for (let auditor in auditors) {
            if (supList.includes(auditor)){
             //   CounterForAuditor.push([auditor,supLimit]);
                objCounterForAuditors[auditor] = supLimit; // obj for faster look-up
            } else {
             //   CounterForAuditor.push([auditor,300]);
                objCounterForAuditors[auditor] = 300;// obj for faster look-up
            }
        }
 
        //console.log(CounterForAuditor);
        console.log(objCounterForAuditors);

 // ==================

        for (let i = 0; i <= 10; i++) {
            for (const associate in resolvedByAssociate) {
                // const auditor = findAuditorWithLeastAudits(assignments, Object.keys(auditors))
               // CounterForAuditor.sort((a,b) => b[1] - a[1]);
                
      //          console.log(CounterForAuditor);

            //    const auditor = getAuditorBasedOnCounter(CounterForAuditor);
                const auditor = getAuditorBasedOnCounter(objCounterForAuditors);
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
// can be used to filter tickets based on remediated rci
                    const tickets = associateTickets.marketplace[marketplace]
                    for (const ticket of tickets) {

                        // Discard ticket if it's already audited
                        if (auditedTickets.includes(ticket)) {
                            //// console.log(`${ticket} has already been audited`)
                            continue
                        }

                        // Discard ticket if it's "no inventory"
                        // if (ticket.rci === "No Inventory") {
                        //     continue
                        // }

                        // Assign ticket to auditor
                        const rci = find("rci", ticket, associateTickets)
                        const extraFeatures = getExtraFeatures({ associate })                      
                        console.log(assignments);
                        assignTicketToAuditor(
                            auditor,
                            associate,
                            ticket,
                            marketplace,
                            rci,
                            extraFeatures, 
                            CounterForAuditor,
                            objCounterForAuditors
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

    // function getAnApolloTicket(associate, resolvedByThisAssociate, index = 0) {
    //     if (!resolvedByThisAssociate.pullType.Apollo) return null
    //     else if (!resolvedByThisAssociate.pullType.Apollo[index]) return null
    //     const currentTicketId = resolvedByThisAssociate.pullType.Apollo[index]
    //     if (auditedTickets.includes(currentTicketId)) getAnApolloTicket(associate, resolvedByThisAssociate, index + 1)

    //     // Discard it if it's a "no inventory" one
    //     if (isThisNoInventory(currentTicketId, resolvedByThisAssociate)) getAnApolloTicket(associate, resolvedByThisAssociate, index + 1)

    //     // Look for marketplace. If there are available auditors for it, assign it.
    //     const marketplace = find("marketplace", currentTicketId, resolvedByThisAssociate)
    //     const spokenBy = findAuditorsByLanguage(marketplace)
    //     if (spokenBy.length < 1) getAnApolloTicket(associate, resolvedByThisAssociate, index + 1)
    //     //// console.log(spokenBy, spokenBy.length < 1)
    //     const auditor = findAuditorWithLeastAudits(assignments, spokenBy, associate)
    //     if (!auditor) getAnApolloTicket(associate, resolvedByThisAssociate, index + 1)
    //     //// console.log({ auditor, associate, currentTicketId, marketplace })
    //     const rci = find("rci", currentTicketId, resolvedByThisAssociate)


    //     const extraFeatures = getExtraFeatures({ associate, ticketType })
    //     assignTicketToAuditor(
    //         auditor,
    //         associate,
    //         currentTicketId,
    //         marketplace,
    //         rci,
    //         true,
    //         extraFeatures
    //     )
    // }

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

    function getAuditorBasedOnCounter(objCounterForAuditors) {
        
        //CounterForAuditor = CounterForAuditor.filter((a) => a[0] !== associate)
        // if (CounterForAuditor.length < 1) return null
        // if (CounterForAuditor.length === 1) return CounterForAuditor[0][0];
        // let selectedAuditor = null;
        // let minCount = -Infinity;
        
        let lenobjCounter = Object.keys(objCounterForAuditors).length

        if (lenobjCounter < 1) return null
        if (lenobjCounter === 1) return Object.keys(objCounterForAuditors)[0];
        let selectedAuditor = null;
        let minCount = -Infinity;



        // CounterForAuditor.sort((a, b) => a[1] - b[1]);
        // //======================= new code    
        //    for (const [auditor, count] of CounterForAuditor) {
        //     if (count) return auditor
        //    }
        // //========================

        // for (const [auditor, count] of CounterForAuditor) {
        //     if (count > minCount) {
        //         minCount = count
        //         selectedAuditor = auditor // auditor with least deductions from counter. Same as auditor with least assignments
        //     }
        // }

        //using object as a counter
        if (anySUPLeft) {
            for (const auditor in objCounterForAuditors) {
                if (supList.includes(auditor)) {
                    return auditor
                }
            }
        }
         // this is return all SUPs as long as they are in the objCounterForAuditors. So if there are no SUPs in the objCounterForAuditors, it will return null

        //now by the time this loop is hit, all sups are assigned tickets as per their limit. So only auditors left are AA

        //console.log(`All sups are assigned`)
        anySUPLeft = false

        for (const auditor in objCounterForAuditors) {
            if (objCounterForAuditors[auditor] > minCount) {
                minCount = objCounterForAuditors[auditor]
                selectedAuditor = auditor // auditor with least deductions from counter. Same as auditor with least assignments
            }
        }
        return selectedAuditor
    }

    function assignTicketToAuditor(auditor, associate, ticket, marketplace, rci, extraFeatures = [],CounterForAuditor = [],objCounterForAuditors={}) {
        if (!auditor) return
        if (auditor === associate) console.error(`For ticket ${ticket}, auditor "${auditor}" equals associate "${associate}".`)
        auditedTickets.push(ticket)
        assignments[auditor].push({ associate, ticket, marketplace, rci, extraFeatures })
        associateCounter[associate]++
        associateAuditedByCount[auditor][associate]++

//         const lenCounter = CounterForAuditor.length;
// //new code
//         for (let i = 0; i < CounterForAuditor.length; i++) {
//             if (CounterForAuditor[i][0] === auditor) {
//                 CounterForAuditor[i][1]--;
//                 objCounterForAuditor[auditor] = CounterForAuditor[i][1];

//                 // If the value becomes 0, remove the element
//                 if (CounterForAuditor[i][1] === 0) {
//                     CounterForAuditor.splice(i, 1);
//                     // Since we've removed an element, adjust the index and length
//                 i--; // Decrement i to check the current index again
//                 }

//                 console.log(CounterForAuditor);
//                 break; // Exit the loop after the first match
//                 }
//         }
// new code using object as counter
        let lenCounter = Object.keys(objCounterForAuditors).length;
        objCounterForAuditors[auditor]--;
        console.log(objCounterForAuditors);

        if (objCounterForAuditors[auditor] === 0) {
            console.log(`Deleting ${auditor} from objCounterForAuditors`);
            delete objCounterForAuditors[auditor];
            console.log(objCounterForAuditors);
        }

//==========================
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