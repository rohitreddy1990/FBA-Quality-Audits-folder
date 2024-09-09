// Randomizer algorithm

// Assigns the tickets to the auditors in a round-robin fashion based on the following criteria: (...)
function randomizerAlgorithm_old(resolvedByAssociate, auditors, adHocTickets, customAudits, currentWeekName) {
    // console.log({
    //     resolvedByAssociate, auditors, adHocTickets, customAudits, currentWeekName
    // })

    // console.log("here we are", customAudits)
    const INITIAL_TICKET_NUMBER = 4
    const supList = ["ssriyans", "summagan", "jmoni", "jpreeth", "hemisas","rincraju","vemuln","girishd"];
    let supLimit = 15;
    let anySUPLeft = true;
    const SUPRC = [/*'Damage Seller Coaching',*/ 'Defective - Non-Testable','Inappropriate Pull', 'Incorrect routing', 'No Inventory'];
    //let anyTicketsleft = true;


     //new code
     var CounterForAuditor = [];
     var objCounterForAuditors = {};

     for (let auditor in auditors) {
         if (supList.includes(auditor)){
          //   CounterForAuditor.push([auditor,supLimit]);
             objCounterForAuditors[auditor] = supLimit; // obj for faster look-up
         } else {
          //   CounterForAuditor.push([auditor,300]);
             objCounterForAuditors[auditor] = 800;// obj for faster look-up
         }
     }

     //console.log(CounterForAuditor);
    // console.log(objCounterForAuditors);

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
        // const allDpTickets = Object.entries(resolvedByThisAssociate.rci)
        //     .filter(([key]) => key.includes("Detail Page"))
        //     .reduce((acc, [, tickets]) => acc.concat(tickets), [])
        // const dpTicketMarkeplaces = filterMarketplace(resolvedByThisAssociate)
  //      getTicketOfType("rci.mldp", associate, { rci: { mldp: allDpTickets }, marketplace: dpTicketMarkeplaces })
        //getTicketOfType("rci.'Inventory Inspection - Coaching Provided'", associate, resolvedByAssociate[associate], 0, false)
    }
    // console.log(
    //     "After assigning an Apollo and an MLDP tickets per associate when possible, this is how assignments look like:",
    //     associateCounter,
    //     assignments,
    // )

    /* 2. Look for the next 2 (or 3, if no Apollo ticket was found) tickets) */
    // console.log(assignments);
    randomlyAssignTickets(auditors, resolvedByAssociate)
    // console.log(assignments);
    // console.log("After assigning tickets trying to meet all requirements, this is how assignments look like:", associateCounter, assignments)

    /* 3. At this point, the tickets of languages not covered by the auditors are not being covered, so some associates don't have tickets audited. Also, some associates only have 2 tickets audited because they only have tickets spoken by one of the auditors. Loop through all associates to ensure they all have 3 tickets audited, even if the auditor has to audit a ticket of an unknown language, or 3 of a single associate. */
   // assignLastTickets(associates, resolvedByAssociate, assignments, auditorLogins)
    //console.log(assignments);


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
              //  const auditor = findAuditorWithLeastAudits(assignments, auditorLogins, associate)
              const auditor = getAuditorBasedOnCounter(objCounterForAuditors);
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
        
        // //new code
    //    console.log("here we are");
        //const supList = ["ssriyans", "summagan", "jmoni", "jpreeth", "hemisas","rincraju","vemuln","girishd"]
        //create a new map object with auditors has the keys and SUPs as the values
//         const auditorSupMap = new Map(Object.entries(auditors).map(([auditor, _]) => [auditor, [...supList]]));
//    //     
//         // Map object has been populated

//         //now create an object where the keys are auditors 
//         //and the values are the SUPs from whom the auditor can't audit
        
//         const auditorToSupCanAuditMapping = {
//             summagan: ["ssriyans", "summagan", "jmoni", "jpreeth", "hemisas","rincraju","vemuln","girishd"],
//             vemuln: ["ssriyans", "summagan", "jmoni", "jpreeth", "hemisas","rincraju","vemuln","girishd"],
//             jmoni: ["ssriyans", "summagan", "jmoni", "jpreeth", "hemisas","rincraju","vemuln","girishd"],
//             jpreeth: ["ssriyans", "summagan", "jmoni", "jpreeth", "hemisas","rincraju","vemuln","girishd"],
//             hemisas: ["ssriyans", "summagan", "jmoni", "jpreeth", "hemisas","rincraju","vemuln","girishd"],
//             rincraju: ["ssriyans", "summagan", "jmoni", "jpreeth", "hemisas","rincraju","vemuln","girishd"],
//             ssriyans: ["ssriyans", "summagan", "jmoni", "jpreeth", "hemisas","rincraju","vemuln","girishd"],

//         //AAs
//             daskris: ["ssriyans", "summagan", "jmoni", "jpreeth","rincraju","vemuln","girishd"],
//             russald: ["ssriyans", "summagan", "jmoni", "hemisas","rincraju","vemuln","girishd"],
//             amanjul: ["jmoni", "jpreeth", "hemisas","rincraju","vemuln","girishd"],
//             kalonm: ["ssriyans", "summagan", "jpreeth", "hemisas","rincraju","vemuln","girishd"]

//         };
//       //  console.log(supToAuditorCanNotAuditMapping);
//         //object done
        
//         //now take each auditor in the map object
//         //and filter out the SUPs from whom the auditor can't audit
//         //and store it in a same map object value
        
//         //modifing the Map object
//         auditorSupMap.forEach((unfilterArrayofSups, auditor) => {
//             //filter the array
//             const filterCriterea = sup => auditorToSupCanAuditMapping[auditor].includes(sup);
//             const allowedSupsForThisAuditor = unfilterArrayofSups.filter(filterCriterea);
//             auditorSupMap.set(auditor, allowedSupsForThisAuditor);
//         });
//         console.log(auditorSupMap);

// ==================
        

        // new code, version 2

        //define a new map object with sup as the key and auditors as the values
        //use the predefined supToAuditorCanAuditMapping object to get the values

        const supToAuditorCanAuditMapping = {
          //  ["ssriyans", "summagan", "vemuln", "jmoni", "jpreeth", "hemisas", "rincraju","daskris" ,"russald","amanjul","kalonm"]
            ssriyans : ["summagan", "vemuln", "jmoni", "jpreeth", "hemisas", "rincraju", "daskris","russald","kalonm","zeeshl","meelir", "nitepate"],
            summagan : ["ssriyans",  "vemuln", "jmoni", "jpreeth", "hemisas", "rincraju", "daskris","russald","kalonm","zeeshl"],
            jpreeth  : ["ssriyans", "summagan", "vemuln", "jmoni",  "hemisas", "rincraju", "daskris","amanjul","kalonm","zeeshl","meelir", "nitepate"],
            hemisas  : ["ssriyans", "summagan", "vemuln", "jmoni", "jpreeth", "rincraju", "russald","amanjul","kalonm","zeeshl","meelir", "nitepate"],
            rincraju : ["ssriyans", "summagan", "vemuln", "jmoni", "jpreeth", "hemisas", "daskris" ,"russald","amanjul","kalonm","zeeshl","meelir", "nitepate"],
            jmoni    : ["ssriyans", "summagan", "vemuln", "jpreeth", "hemisas", "rincraju","daskris" ,"russald","amanjul","meelir", "nitepate"],
            vemuln   : ["ssriyans", "summagan", "jmoni", "jpreeth", "hemisas", "rincraju","daskris" ,"russald","amanjul","kalonm","zeeshl","meelir", "nitepate"],
            girishd  : ["ssriyans", "summagan", "vemuln", "jmoni", "jpreeth", "hemisas", "rincraju","daskris" ,"russald","amanjul","kalonm","zeeshl","meelir", "nitepate"],
        };
        // object done, now get the values of the map object

        // make a map with sup as the key and auditors as the values are a list of sups obtained from the above object
        // this will be done based on the object supToAuditorCanAuditMapping

       // console.log(Object.keys(auditors));

        const supToAuditorMap = new Map(
            supList.map(sup => {
                const selectedAuditors = Object.keys(auditors);
                const filterCriteria = auditor => selectedAuditors.includes(auditor);
                return [sup, supToAuditorCanAuditMapping[sup].filter(filterCriteria)]
            })
        );
        
       // console.log(supToAuditorMap);
        // now the map object is ready
        // each sup has a list of auditors allowed for the sup
        // use this to get the auditors for each associate


 // ==================

        for (let i = 0; i <= 15; i++) {
            for (const associate in resolvedByAssociate) {
                // const auditor = findAuditorWithLeastAudits(assignments, Object.keys(auditors))
               // CounterForAuditor.sort((a,b) => b[1] - a[1]);
                
      //          console.log(CounterForAuditor);

            //    const auditor = getAuditorBasedOnCounter(CounterForAuditor);
             //   const associateSUP = resolvedByAssociate[associate]['SUP'];
              //  const auditor = getAuditorBasedOnCounter(objCounterForAuditors, supToAuditorMap.get(associateSUP));
                const auditNum = getAssociateAuditNum(customAudits, associate, currentWeekName, INITIAL_TICKET_NUMBER)

                // If associate has already 3 tickets audited, go to next associate
                if (associateCounter[associate] >= auditNum) {
                    //// console.log(`${associate} has already 3 tickets audited`)
                    continue
                }

                

                let ticketFound = false
                let associateTickets = resolvedByAssociate[associate]
              //  console.log(associateTickets['SUP']);

                for (const marketplace in associateTickets.marketplace) {

                    // Check if auditor can audit this marketplace
                    // if (!auditors[auditor].includes(marketplace)) {
                    //     //// console.log(`${auditor} cannot audit a ticket of marketplace ${marketplace}`)
                    //     continue
                    // }
                    // can be used to filter tickets based on remediated rci
                    let tickets = associateTickets.marketplace[marketplace]
                    //console.log("logging here",associateTickets.marketplace[marketplace]);
                    for (const ticket of tickets) {

                        // Discard ticket if it's already audited
                        if (auditedTickets.includes(ticket)) {
                            
                            console.log(`${ticket} has already been audited`)
                            //console.log("before removing element",tickets);
                            associateTickets.marketplace[marketplace] = associateTickets.marketplace[marketplace].filter(t => t !== ticket);
                            //tickets = tickets.reverse();
                            //console.log(tickets);
                            continue
                            
                        }

                        // Discard ticket if it's "Damage"
                        // if (ticket.rci === 'Damage Seller Coaching') {
                        //     continue
                        // }

                        // Assign ticket to auditor
                        const rci = find("rci", ticket, associateTickets);
                        const associateSUP = resolvedByAssociate[associate]['SUP'];
                        const mapping = supToAuditorMap.get(associateSUP);
                        const auditor = getAuditorBasedOnCounter(objCounterForAuditors, mapping, rci);

                       // If associate is the auditor, go to next associate
                        if (associate === auditor) {
                                //// console.log(`${associate} is the auditor ${auditor}`)
                                continue
                        }

                        //If this auditor already audited 2 tickets for this associate, go to next associate // TO DO: should this be > (auditNum/2) instead?
                        if (associateAuditedByCount[auditor][associate] >= 2) {
                            //// console.log(`${auditor} already audited 2 tickets for ${associate}`)
                            continue
                        }

                        //Check if auditor can audit this marketplace
                        if (!auditors[auditor].includes(marketplace)) {
                        //// console.log(`${auditor} cannot audit a ticket of marketplace ${marketplace}`)
                            continue
                        }


                        const extraFeatures = getExtraFeatures({ associate })                      
                        //console.log(assignments);
                        assignTicketToAuditor(
                            auditor,
                            associate,
                            ticket,
                            marketplace,
                            rci,
                            extraFeatures, 
                            supToAuditorMap,
                            objCounterForAuditors,
                            associateTickets,
                            assignments
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

    // function getTicketOfType(type, associate, resolvedByThisAssociate, index = 0, discardNoInventory = true) {
    //     const [ticketTypeCategory, ticketType] = type.split(".")

    //     const currentTicketId = resolvedByThisAssociate[ticketTypeCategory]?.[ticketType]?.[index] ?? null
    //     if (!currentTicketId) return null
    //     if (auditedTickets.includes(currentTicketId)) return getTicketOfType(type, associate, resolvedByThisAssociate, index + 1, discardNoInventory)

    //     // Discard it if it's a "no issue found" one
    //     if (discardNoInventory && isThisNoInventory(currentTicketId, resolvedByThisAssociate))
    //         return getTicketOfType(type, associate, resolvedByThisAssociate, index + 1, discardNoInventory)

    //     // Look for marketplace. If there are available auditors for it, assign it.
    //     const marketplace = find("marketplace", currentTicketId, resolvedByThisAssociate)
    //     const spokenBy = findAuditorsByLanguage(marketplace)
    //     if (spokenBy.length < 1) return getTicketOfType(type, associate, resolvedByThisAssociate, index + 1, discardNoInventory)
    //     //// console.log(spokenBy, spokenBy.length < 1)
    //     const auditor = findAuditorWithLeastAudits(assignments, spokenBy, associate)
    //     if (!auditor) return getTicketOfType(type, associate, resolvedByThisAssociate, index + 1, discardNoInventory)
    //     //// console.log({ auditor, associate, currentTicketId, marketplace })
    //     const rci = find("rci", currentTicketId, resolvedByThisAssociate)


    //     const extraFeatures = getExtraFeatures({ associate, ticketType })
    //     assignTicketToAuditor(
    //         auditor,
    //         associate,
    //         currentTicketId,
    //         marketplace,
    //         rci,
    //         extraFeatures
    //     )
    // }

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

    // function isThisNoInventory(ticketId, resolvedByThisAssociate) {
    //     const noInventoryRci = "Inventory Inspection - Coaching Provided"
    //     const output = resolvedByThisAssociate.rci[noInventoryRci] && resolvedByThisAssociate.rci[noInventoryRci].includes(ticketId)
    //     return output
    // }

    // function findAuditorsByLanguage(language) {
    //     // A more efficient, yet slightly less readable alternative: const auditorsList = Object.entries(auditors).reduce((acc, [auditor, langs]) => langs.includes(lang) ? [...acc, auditor] : acc, []);
    //     const auditorsList = Object.entries(auditors)
    //         .filter(([auditor, languages]) => languages.includes(language))
    //         .map(([auditor, languages]) => auditor)
    //     return auditorsList
    // }

    // function findAuditorWithLeastAudits(assignments, auditors, associate = "") {
    //     auditors = auditors.filter(auditor => auditor !== associate)
    //     if (auditors.length < 1) return null
    //     if (auditors.length === 1) return auditors[0]
    //     let minCount = Infinity
    //     let selectedAuditor = null

    //     for (const auditor in assignments) {
    //         if (auditors.includes(auditor) && assignments[auditor].length < minCount) {
    //             minCount = assignments[auditor].length
    //             selectedAuditor = auditor
    //         }
    //     }
    //     return selectedAuditor
    // }

    function getAuditorBasedOnCounter(objCounterForAuditors, auditorList = [], RC = "") {
        
      //  console.log(auditorList);
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
        console.log(RC);

        if (anySUPLeft) {
            for (const auditor in objCounterForAuditors) {
                if (auditorList.includes(auditor) &&  supList.includes(auditor)) {
                    if (auditor === "ssriyans") {
                        console.log('Returning Auditor as SS');
                       }
                    return auditor
                }
            }
        }


        //take the RC, return a SUP if rc is in the SUP list
        // return a auditor otherwise, ensure that the auditor is a AA, not in SUP list


         // this is return all SUPs as long as they are in the objCounterForAuditors. So if there are no SUPs in the objCounterForAuditors, it will return null

        //now by the time this loop is hit, all sups are assigned tickets as per their limit. So only auditors left are AA

        //console.log(`All sups are assigned`)
        anySUPLeft = false

        //use the auditorList and the objCounterForAuditors to find the auditor with the least assignments
        //and return the same auditor

        // for (const auditor in objCounterForAuditors) {
        //     if (objCounterForAuditors[auditor] > minCount) {
        //         minCount = objCounterForAuditors[auditor]
        //         selectedAuditor = auditor // auditor with least deductions from counter. Same as auditor with least assignments
        //     }
        // }
        // return selectedAuditor


        for (const auditor of auditorList) {
            if (objCounterForAuditors[auditor] > minCount) {
                minCount = objCounterForAuditors[auditor];
                selectedAuditor = auditor
            }
        }
        return selectedAuditor

    }

    function assignTicketToAuditor(auditor, associate, ticket, marketplace, rci, extraFeatures = [],supToAuditorMap = {},objCounterForAuditors={},associateTickets={},assignments={}) {
        
        if (!auditor) return
        if (auditor === associate) console.error(`For ticket ${ticket}, auditor "${auditor}" equals associate "${associate}".`)
        
       // const isSUP = supList.includes(auditor);
        const SUP = associateTickets['SUP'];
        const c = SUPRC.includes(rci) 
        const AuditorInMapping = supToAuditorMap.get(SUP).includes(auditor);
       // console.log(associateTickets['SUP']);

       if (c && auditor === "ssriyans") {
        console.log(`Assigning ticket to ${auditor}`);
       }

        // if (isSUP) { //add to the array only is SUP and rci as as defect / damage
            if (c /*&& AuditorInMapping*/) {
                auditedTickets.push(ticket)
                assignments[auditor].push({ associate, ticket, marketplace, rci, extraFeatures })
                associateCounter[associate]++
                associateAuditedByCount[auditor][associate]++
                associateTickets.marketplace[marketplace] = associateTickets.marketplace[marketplace].filter(t => t !== ticket);
                objCounterForAuditors[auditor]--;
            } else {
                //console.log("didn't assign this TT");
                //get a non SUP auditor and push the ticket to them
                //const nonSupAuditor = getnonSupAuditor(objCounterForAuditors)                
                const auditor = getnonSupAuditor(objCounterForAuditors,supToAuditorMap.get(SUP)) // the auditor has been changed to a a non SUP auditor
                auditedTickets.push(ticket)
                assignments[auditor].push({ associate, ticket, marketplace, rci, extraFeatures })
                associateCounter[associate]++
                associateAuditedByCount[auditor][associate]++
                associateTickets.marketplace[marketplace] = associateTickets.marketplace[marketplace].filter(t => t !== ticket);
                objCounterForAuditors[auditor]--;
            }           

            if (objCounterForAuditors[auditor] === 0) {
             //    console.log(`Deleting ${auditor} from objCounterForAuditors`);
                delete objCounterForAuditors[auditor];
                //write code to delete auditor from the values of map object
                // go over each key, use auditor as the key
                //and delete auditor from the array of values
                supToAuditorMap.forEach((auditorArray, sup) => {
                    const mapFilter = a => a !== auditor;
                    //remove the auditor from the list of values of each key
                    const updatedArray = auditorArray.filter(mapFilter);
                    supToAuditorMap.set(sup, updatedArray);
                })
            //    console.log(supToAuditorMap);

               // console.log(objCounterForAuditors);
                //console.log(assignments);
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

    function getnonSupAuditor(objCounterForAuditors, allowedAuditorList = []) {

        let minCount = -Infinity;
        let selectedAuditor = null;

        // for (const auditor in objCounterForAuditors) {
        //     if (!supList.includes(auditor) ) {
        //         if (objCounterForAuditors[auditor] > minCount) {
        //             minCount = objCounterForAuditors[auditor];
        //             selectedAuditor = auditor;
        //         }
        //     }
        // }

        for (const auditor of allowedAuditorList) {
            //loop over all the allowed auditors
            //check the the present auditor is a SUP or a AA
            //if the auditor is a AA, then check their counter
            //if the counter is greater than the minimum count, set the min counter
            //then set that auditor
            //update the minimum count

            // as I loop over all auditors, the auditor with the least assignemnts will be selected
            // as their counter will have the least deductions from the base


            if (!supList.includes(auditor)) { //non sup auditor
                if (objCounterForAuditors[auditor] > minCount) { // noting  the audotor with the least assignments
                    minCount = objCounterForAuditors[auditor]; 
                    selectedAuditor = auditor;
                }
            }
        }
        return selectedAuditor;
    }
}