removeAnnouncements()

const floatingFeedback = new FloatingFeedback()
floatingFeedback.updateText("Setting tabs...")
setTabs()
let teamDatabase, touchDatabase, customAudits
startup()

/*This JavaScript function, startup(), is an asynchronous function that is likely used as a setup function for a web application. Here's a breakdown of what it does:

It sets the initial text of a floatingFeedback object to "Setting search queries...".
It creates a today variable with the current date and time.
It creates a lastWeek variable that is 7 days before the current date.
It retrieves the date from the URL query parameters, or sets it to lastWeek if not provided.
It retrieves the timeRange from the URL query parameters, or sets it to "week" if not provided.
It retrieves the unit from the URL query parameters, or sets it to "team-all" if not provided.
It updates the floatingFeedback text to "Importing team data...".
It fetches the teamDatabase file from the server using the fetchFile function. If the file is not found, it displays an alert message and returns.
It updates the floatingFeedback text to "Importing custom audits...".
It fetches the customAudits file from the server using the fetchFile function, and assigns an empty array if the file is not found.
It updates the floatingFeedback text to "Importing resolved tickets...".
It fetches all weeks of resolved tickets from the server using the fetchAllWeeks function.
It updates the floatingFeedback text to "Setting search form...".
It calls the setSearchForm function with the teamDatabase, date, and timeRange as arguments.
It calls the [main](cci:1://c:\Users\amrohtm\Desktop\Quality Audits folder\script.js:38:0-820:1) function with the date, timeRange, and unit as arguments.
This function is likely called when the web application is first loaded, and it sets up the initial state of the application by fetching necessary data and calling the [main](cci:1://c:\Users\amrohtm\Desktop\Quality Audits folder\script.js:38:0-820:1) function to start the application's main logic.*/
async function startup() {
    // Function to be runned just when we access the website, not every time we submit a new search
    floatingFeedback.updateText("Setting search queries...")
    const today = new Date()
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const date = new URL(location.href).searchParams.get("date") || lastWeek
    const timeRange = new URL(location.href).searchParams.get("date-range") || "week"
    const unit = new URL(location.href).searchParams.get("unit") || "team-all"
    //const tab = new URL(location.href).searchParams.get('tab') || "team"

    // Import all
    floatingFeedback.updateText("Importing team data...")
    teamDatabase = await fetchFile("teamDatabase", "json")
    if (!teamDatabase) {
        alert(`No team data found. Please add a file named "teamDatabase" in the root folder. Other names, such as "teamDatabase(2)", aren't valid.`)
        return
    }
    
    floatingFeedback.updateText("Importing custom audits...")
    customAudits = await fetchFile("custom-audits", "csv") || []
    // console.log({ customAudits })
    floatingFeedback.updateText("Importing resolved tickets...")
    touchDatabase = await fetchAllWeeks(today)
    // console.log(touchDatabase)

    floatingFeedback.updateText("Setting search form...")
    setSearchForm(teamDatabase, date, timeRange)

    main(date, timeRange, unit)
}

async function main(date, timeRange, unit) {

    //////////
    // ticket list
    // var touchDatabase = [
    //     {
    //         week: "",
    //         data: {
    //             login: [
    //                 {
    //                     ticket: "data",
    //                     // ...
    //                 },
    //                 // ...
    //             ]
    //         }
    //     }
    // ]

    const ticketList = Object
        .values(touchDatabase[0].data)
        .flat()
        .map(ticket => ({ ...ticket, associate: kerberosToLogin(ticket.associate) }))
    const associates = Object
        .keys(touchDatabase[0].data)
        .map(kerberosToLogin)

    //////////
    document.querySelector("#date-input").value = toIsoDate(date)
    document.querySelector("#unit-input").value = unit
    document.querySelector("#" + timeRange).checked = true

    const [allTimeUnits, availableWeeks, notAvailableWeeks] = getWeeksLists(
        timeRange,
        timeRange === "day" ? timeChartsLength * 7 : timeChartsLength,
        getYearAndYearWeek(toIsoDate(date)),
        touchDatabase.map(e => e.week),
        date,
    ).map(e => e.reverse())
    // console.log({ allTimeUnits, availableWeeks, notAvailableWeeks })
    // En allTimeUnits tengo hasta la semana 6, en availableWeeks tengo hasta la semana 7

    floatingFeedback.removeFeedback()
    const currentWeekName = getYearAndYearWeek(date)
    // console.log("currentWeekName", currentWeekName)
    const foundWeekNames = []
    const currentWeekData = touchDatabase.find(({ week }) => {
        foundWeekNames.push(week)
        return week === currentWeekName
    })?.data
    if (!currentWeekData) {
        const foundWeeks = touchDatabase.map(e => e.week).join(", ")
        alert(`Selected week, ${currentWeekName}, is not in the database. The following weeks were found: ${foundWeeks}`)
        return
    }
    // console.log(currentWeekData)

    new Section(
        "performance",
        "performance-ticket-table",
        `QA ticket selection for ${getYearAndYearWeek(date)}`,
        {},
        `
            <h3>Auditor assignments</h3>
            <div id="assignments">
            <div>Please select one or more auditors to assign the audits:</div>
            </div>
            <h3>Summary</h3>
            <div class="summary-area">
                <!-- <canvas id="barChart" width="500" height="300"></canvas> -->
                <div id="chart-area"></div>
                <div class="summary-table"></div>
            </div>
            <h3>
                <span>Tickets resolved per associate</span>
                <button class="secondary" id="download-table-qa-button">Download</button>
            </h3>
            <table class="main-table"></table>
      `,
        (section, instance) => {
         //   var whichTeam = prompt("Please enter the SUP's login id");
            const ticketFilterDownload = new TicketFilter(currentWeekData, teamDatabase);
            console.log(ticketFilterDownload.data);

           /* const associatesLoginforSup = Object.keys(getSupervisorTeamMembers(whichTeam, teamDatabase));
            console.log(associatesLoginforSup);
          console.log(ticketFilterDownload.data); */

           /*  //new code, filter ticketFilterDownload by team
            var filteredAssociates = {};

                // Iterate over the keys in the associates object
           for (let associate in associatesLoginforSup) {
                   let login = associatesLoginforSup[associate];
                // Check if the key is also an element in the team array
                    if (login in ticketFilterDownload.data) {
                // Add the key and its value to the filteredAssociates object
                    filteredAssociates[login] = ticketFilterDownload.data[login];
                //  console.log(filteredAssociates);
                    } 
                }

           // console.log(filteredAssociates);
            ticketFilterDownload.data = filteredAssociates;
            console.log(ticketFilterDownload.data);
 */
            //end new code  

            const dataToDownload = ticketFilterDownload.get_resolvedList_onWeek(date)
            const downloadTableQaButton = section.querySelector("#download-table-qa-button")
            downloadTableQaButton.addEventListener("click", () => {
                const selectedResolver = document.querySelector("#unit-input").value
                if (selectedResolver === "team-all") {
                    downloadCSV(dataToDownload, `Resolved on ${getYearAndYearWeek(date)} by team-all`)
                } else if (supervisors.some(supervisor => selectedResolver === supervisor)) {
                    const teamMembers = Object.keys(getSupervisorTeamMembers(selectedResolver, teamDatabase))
                    const dataToDownloadFiltered = dataToDownload.filter(touch => teamMembers.some(teamMember => teamMember === touch.login))
                    downloadCSV(dataToDownloadFiltered, `Resolved on ${getYearAndYearWeek(date)} by ${selectedResolver}'s team`)
                } else {
                    const dataToDownloadFiltered = dataToDownload.filter(touch => touch.login === selectedResolver)
                    downloadCSV(dataToDownloadFiltered, `Resolved on ${getYearAndYearWeek(date)} by ${selectedResolver}`)
                }
            })

            makeHeaderSticky(section)
            // console.log("currentWeekData", currentWeekData)
            const features = ["marketplace", "pullType", "rci"]
            const ticketFilter = new TicketFilter(currentWeekData, teamDatabase)
           // ticketFilter.data = filteredAssociates;
           // console.log("this is it:", { ticketFilter })
            
            let resolvedByAssociate = ticketFilter.get_resolvedByAssociate_onWeek(date, features)
            
            const [manualMustAuditTickets, unqFailMustAuditTickets, skipAuditTickets] = ticketFilter.get_adHocTickets_onWeek(date)


            const allLanguages = ["UK", "US", "CA", "EG", "AE", "SA", "SG"]/* , "BR", "IT", "FR", "BE"] */
            /*const auditorLanguages = {
                stschol: ["UK", "DE", "NL", "SE", "PL", "ES", "MX", "BR"],
                shizab: ["UK", "DE", "NL", "SE", "PL", "ES", "MX", "BR"],
                lambrini: ["UK", "DE", "NL", "SE", "PL", "ES", "MX", "BR"],
                clauacri: ["UK", "DE", "NL", "SE", "PL", "ES", "MX", "IT", "BR"],
                ciimbert: ["UK", "SE", "FR", "BE", "BR"],
                usuika: ["UK", "DE", "NL", "SE", "PL", "ES", "MX", "BR"],
            }*/

            const assignmentsContainer = document.getElementById("assignments")
            displayAuditorSelector(assignmentsContainer, auditorLanguages)
            // displayAssignments(assignmentsContainer, assignments)

            function displayAuditorSelector(assignmentsContainer, auditorLanguages) {
                const availableAuditors = Object.keys(auditorLanguages)
                const auditorSelectorHtml = availableAuditors
                    .map(auditor => {
                        return `
                            <label auditor="${auditor}" class="audit-assignments">
                                <div class="audit-assignments-auditor-header">
                                    <input type="checkbox" value="${auditor}" name="auditor-selection"/>
                                    <img src="https://internal-cdn.amazon.com/badgephotos.amazon.com/?uid=${auditor}" class="badge-img">
                                    <div>${auditor}</div>
                                </div>
                            </label>`
                    })
                    .join("\n")

                const selectAuditorsButton = document.createElement("button")
                selectAuditorsButton.classList.add("primary")
                selectAuditorsButton.setAttribute("id", "select-auditors-button")
                selectAuditorsButton.innerHTML = "Select auditors"
                

                selectAuditorsButton.addEventListener("click", selectAuditors)

                assignmentsContainer.innerHTML += auditorSelectorHtml
                assignmentsContainer.appendChild(selectAuditorsButton)
            }

            function selectAuditors() {
                
                //new code
                
                // const features = ["marketplace", "pullType", "rci"]
                // const ticketFilter = new TicketFilter(currentWeekData, teamDatabase)
                // //console.log({ ticketFilter })
                
                /* let resolvedByAssociate = ticketFilter.get_resolvedByAssociate_onWeek(date, features)
                
                const [manualMustAuditTickets, unqFailMustAuditTickets, skipAuditTickets] = ticketFilter.get_adHocTickets_onWeek(date)
// 

                const selected_sup = document.getElementById('unit-input').value;
                console.log(resolvedByAssociate);
                if(selected_sup !== "team-all") {
                    console.log(selected_sup);
                    //ticketFilter = new TicketFilter(currentWeekData, teamDatabase);
                    // resolvedByAssociate = ticketFilter.getAssociatesByTeam(selected_sup);
                    console.log(resolvedByAssociate);
                }; */
                
                const selectedAuditors = Array.from(document.querySelectorAll("input[name='auditor-selection']:checked")).map(
                    checkbox => checkbox.value,
                )
                if (selectedAuditors.length < 1) return alert("Please select at least one auditor to continue.")

                function filterAuditors(languages, auditors) {
                    const result = {}
                    auditors.forEach(auditor => {
                        if (languages.hasOwnProperty(auditor)) {
                            result[auditor] = languages[auditor]
                        } else {
                            alert(`Auditor "${auditor}" has no languages assigned. It will be accepting all marketplaces.`)
                            result[auditor] = allLanguages
                        }
                    })
                    return result
                }

                const auditors = filterAuditors(auditorLanguages, selectedAuditors)

                const currentCustomAudits = customAudits.filter(customAudit => customAudit.week === currentWeekName)
                
                //Assigns the total tickets to each auditor, but only distributed the total set of tickets among the selected auditors. Not randomized.
                const assignments = randomizerAlgorithm_old(resolvedByAssociate, auditors, [manualMustAuditTickets, unqFailMustAuditTickets, skipAuditTickets], currentCustomAudits, currentWeekName)
                
                const assignments_new = randomizerAlgorithm(ticketList, auditors, associates, currentCustomAudits)
                
                // Weekly Randomizer Check
                const today = new Date().toISOString().slice(0, 10)
                console.log(`Weekly Randomizer Check: ${today}. Old assignments method:`, assignments, JSON.stringify(assignments))
                console.log(`Weekly Randomizer Check: ${today}. New assignments method:`, assignments_new, JSON.stringify(assignments_new))
                //

                displayAssignments(assignmentsContainer, assignments, auditors)

                /////// SUMMARY TABLE ///////
                updateSummaryTable(assignments)


                /////// RESOLVED PER ASSOCIATE ///////
                const table = section.querySelector(".main-table")
                table.innerHTML = generateTable(resolvedByAssociate, assignments, auditors)
                addButtonInteraction(table)
                addContextMenus(".contextMenu-trigger > span")
                hideContextmenus()

                addFiltersToTableColumns(section)
                function generateTable(resolvedByAssociate, assignments, auditors) {
                    let table = [
                        `<thead>`,
                        `  <tr>`,
                        `    <th>Login</th>`,
                        `    <th>Total</th>`,
                        `    <th>Marketplace</th>`,
                        `    <th>Pull type</th>`,
                        `    <th>RCI</th>`,
                        `    <th>To be audited</th>`,
                        `  </tr>`,
                        `</thead>`,
                        `<tbody>`,
                    ].join("\n")

                    for (const associate in resolvedByAssociate) {
                        const countryShortNameData = resolvedByAssociate[associate].marketplace
                        const pullTypeData = resolvedByAssociate[associate].pullType
                        const rciData = resolvedByAssociate[associate].rci
                        const newHire = isNewHire(associate, teamDatabase)

                        const associateRowHtml = [
                            `<img src="https://internal-cdn.amazon.com/badgephotos.amazon.com/?uid=${associate}" class="badge-img" />`,
                            `<div>${associate}</div>`,
                            newHire ? `<p class="associate-info" title="Hire date: ${teamDatabase[associate][3]}">New hire</p>` : "",
                        ].join("\n")

                        const countryShortNameText = createCell(countryShortNameData, true)
                        const rciText = createCell(rciData)

                        const pullTypeText = Object.entries(pullTypeData)
                            .map(([pullType, ticketList]) => generatePullTypeHtml(pullType, ticketList, associate))
                            .join("")

                        const auditedText = [
                            `<div class="auditedBy-list">`,
                            getTicketIdsForAssociate(assignments, associate).map(([ticket, auditor, marketplace, rci, extraFeatures]) => getAuditedTicketHTMLAssociateTable({ ticket, auditor, marketplace, rci, extraFeatures })).join(""),
                            `</div>`,
                        ].join("")

                        const auditorDropdownOption = (associate, auditor) => associate === auditor ? "" : `<li auditor="${auditor}">${auditor}</li>`
                        const actionsArea = [
                            `<div class="associate-actions-area contextMenu-trigger">`,
                            `    <button class="assign-new-ticket secondary" associate="${associate}">Assign new ticket</button>`,
                            `    <div class="contextMenu hidden">`,
                            `        <div>Select an auditor:</div>`,
                            `        <ul>${Object.keys(auditors).map(auditor => auditorDropdownOption(associate, auditor)).join("")}</ul>`,
                            `    </div>`,
                            `</div>`
                        ].join("")

                        table += [
                            `<tr associate="${associate}" ${newHire ? 'class="new-hire"' : ''}>`,
                            `  <td class="login-cell">${associateRowHtml}</td>`,
                            `  <td>${resolvedByAssociate[associate].totalResolved.length}</td>`,
                            `  <td class="oppositeColumns-cell"><div>${countryShortNameText}</div></td>`,
                            `  <td class="oppositeColumns-cell"><div>${pullTypeText}</div></td>`,
                            `  <td class="oppositeColumns-cell"><div>${rciText}</div></td>`,
                            `  <td>${auditedText}${actionsArea}</td>`,
                            `</tr>`,
                        ].join("\n")
                    }

                    table += `</tbody>`

                    return table

                    function getTicketIdsForAssociate(assignments, associate) {
                        const ticketIds = []
                        for (const auditor in assignments) {
                            for (const ticket of assignments[auditor]) {
                                if (ticket.associate === associate) {
                                    //// console.log(ticket)
                                    ticketIds.push([ticket.ticket, auditor, ticket.marketplace, ticket.rci, ticket.extraFeatures])
                                }
                            }
                        }
                        return ticketIds
                    }

                    function createCell(data, isThisACountry = false) {
                        return Object.entries(data)
                            .map(([key, value]) => ([
                                `<span>${isThisACountry ? getFlagEmoji(key) : ""} ${key}:</span>`,
                                `<span>${value.length}</span>`,
                            ]).join("\n")
                            )
                            .join("")
                    }

                    function generatePullTypeHtml(pullType, ticketList, associate) {
                        const ticketListHtml = ticketList
                            .map(ticketId => `<li><a href="https://t.corp.amazon.com/${ticketId}" target="_blank">${ticketId}</a></li>`)
                            .join("")
                        return `
                            <div class="contextMenu-trigger">
                                <span>${pullType}:</span>
                                <div class="contextMenu hidden">
                                    <div>${associate}'s ${pullType} tickets:</div>
                                    <ul>
                                        ${ticketListHtml}
                                    </ul>
                                </div>
                            </div>
                            <span>${ticketList.length}</span>`
                    }
                }
                function getAuditedTicketHTMLAssociateTable({ ticket, auditor, marketplace, rci, extraFeatures }) {
                    const extraFeatureDisplayNames = {
                        "extra": "Extra ticket",
                        "manual-must-audit": "Ad hoc ticket",
                        "unq-fail-must-audit": "Unquarantine fail",
                        "handpicked": "Hand-picked ticket",
                        "apollo": "Apollo ticket",
                        "mldp": "MLDP ticket",
                    }
                    const extraFeaturesIcons = extraFeatures.map(extraFeature => {
                        const displayName = extraFeatureDisplayNames[extraFeature] || "Non-identified"
                        return `<span class="extraFeature-marker ${extraFeature}-marker" title="This is a ${displayName} ticket">${displayName}</span>`
                    })

                    return [
                        `<span>${getFlagEmoji(marketplace)}</span>&nbsp;`,
                        `<a href="https://t.corp.amazon.com/${ticket}" target="_blank" title="${rci}">${ticket}</a>&nbsp;`,
                        `<span>(${auditor})</span>&nbsp;`,
                        //`${extraFeatures ? '<span class="extraFeature-marker" title="This is an Apollo ticket">A</span>' : ""}`,
                        ...extraFeaturesIcons,
                        `<br>`
                    ].join("")
                }
                function addContextMenus(triggerSelector) {
                    const triggerElements = Array.from(section.querySelectorAll(triggerSelector))
                    triggerElements.forEach(triggerElement => {
                        const contextMenu = triggerElement.parentNode.querySelector(".contextMenu")
                        triggerElement.addEventListener("click", event => {
                            event.preventDefault()
                            event.stopPropagation()
                            contextMenu.style.left = event.pageX + "px"
                            contextMenu.style.top = event.pageY + "px"
                            contextMenu.classList.remove("hidden")
                        })
                    })
                }
                function hideContextmenus() {
                    // Hide contextmenus when clicking outside
                    section.addEventListener("mousedown", event => {
                        const contextMenus = Array.from(section.querySelectorAll(".contextMenu"))
                        const isInsideContextMenu = contextMenus.some(contextMenu => contextMenu.contains(event.target))
                        if (!isInsideContextMenu) {
                            contextMenus.forEach(contextMenu => contextMenu.classList.add("hidden"))
                        }
                    })
                }
                function addButtonInteraction(table) {
                    const extraTicketActions = {
                        assignExtraTicket: (associate, auditor) => {
                            const thereIsNoAssociate = !associate
                            const thereIsNoAauditor = !auditor
                            const associateEqualsAuditor = associate === auditor
                            if (thereIsNoAssociate || thereIsNoAauditor || associateEqualsAuditor) {
                                const message = [
                                    thereIsNoAssociate ? `There is no associate selected` : "",
                                    thereIsNoAauditor ? `There is no auditor selected` : "",
                                    associateEqualsAuditor ? `Auditor "${auditor}" equals associate "${associate}"` : "",
                                ].join(" & ")
                                extraTicketActions.error_notificate(message, "error")
                                return
                            }

                            const resolvedByTargetAssociate = resolvedByAssociate[associate]
                            if (!resolvedByTargetAssociate?.totalResolved?.length) {
                                extraTicketActions.error_notificate(`There don't seem to be tickets resolved by ${associate}`)
                                return
                            }

                            const notAuditedTicket = extraTicketActions.getNotAuditedTicket({ assignments, resolvedByTargetAssociate })

                            if (!notAuditedTicket) {
                                const resolvedNum = resolvedByTargetAssociate.totalResolved.length
                                const message = `All the ${resolvedNum} tickets resolved by ${associate} are already assigned`
                                extraTicketActions.error_notificate(message)
                                return
                            }

                            const { marketplace, rci, extraFeatures } = extraTicketActions.getTicketData(resolvedByTargetAssociate, notAuditedTicket)

                            extraTicketActions.assignTicket({
                                auditor,
                                associate,
                                ticket: notAuditedTicket,
                                marketplace,
                                rci,
                                extraFeatures
                            })
                        },
                        getNotAuditedTicket: ({ assignments, resolvedByTargetAssociate }) => {
                            const auditedTickets = Object.values(assignments).flat()
                            const isNotAudited = (ticket) => auditedTickets.every(auditedTicket => auditedTicket.ticket !== ticket)
                            return resolvedByTargetAssociate.totalResolved.find(ticket => isNotAudited(ticket))
                        },
                        getTicketData: (resolvedByTargetAssociate, ticketId) => {
                            const ticketData = {}
                            for (const ticketTypeCategory in resolvedByTargetAssociate) {
                                const ticketsInCategory = Object.entries(resolvedByTargetAssociate[ticketTypeCategory])
                                const foundCategory = ticketsInCategory.find(([category, ticketIDs]) => ticketIDs.includes(ticketId))?.[0]
                                if (!foundCategory) {
                                    extraTicketActions.error_notificate(`${ticketTypeCategory} not found for ticket ${ticketId}`, "error")
                                    ticketData[ticketTypeCategory] = "Not found"
                                    continue
                                }
                                ticketData[ticketTypeCategory] = foundCategory
                            }
                            ticketData.extraFeatures = ticketData.pullType === "Apollo"
                            return ticketData
                        },
                        assignTicket: ({ auditor, associate, ticket, marketplace, rci, extraFeatures }) => {
                            const ticketData = {
                                auditor,
                                associate,
                                ticket,
                                marketplace,
                                rci,
                                extraFeatures: ["handpicked"]
                            }
                            // console.log({ assignments, auditor })
                            assignments[auditor].push(ticketData)
                            // console.log("New ticket assigned:", ticketData)
                            createNotification({
                                message: `New ticket assigned: ${ticket} to ${auditor}`,
                                emoji: "✔️",
                                shakeAnimation: false
                            })
                            extraTicketActions.updateUI(ticketData, ticket)
                        },
                        updateUI: (ticketData) => {
                            const { auditor, associate, ticket, marketplace, rci, extraFeatures } = ticketData

                            // Associate table
                            const associateAuditedCell = section.querySelector(`tr[associate="${associate}"]>td:last-of-type>.auditedBy-list`)
                            if (!associateAuditedCell) {
                                extraTicketActions.error_notificate(`The assigned ticket could not be shown in the associates' table`, "error")
                                return
                            }
                            const newHTML = getAuditedTicketHTMLAssociateTable({ ticket, auditor, marketplace, rci, extraFeatures })
                            associateAuditedCell.innerHTML += newHTML
                            // TO DO: update the rest of the cells

                            // Auditor table (new row)
                            const auditorSection = section.querySelector(`details[auditor="${auditor}"]`)
                            const auditorAuditedCell = auditorSection.querySelector(`ol`)
                            if (!associateAuditedCell) {
                                extraTicketActions.error_notificate(`The assigned ticket could not be shown in the auditors' table`, "error")
                                return
                            }
                            const row = getAuditedTicketNodeAuditorTable({ associate, ticket, marketplace })
                            auditorAuditedCell.appendChild(row)

                            // Auditor table (links rack)
                            const auditorTicketIDs = assignments[auditor].map(ticketData => ticketData.ticket)
                            extraTicketActions.updateLinks(auditor, auditorTicketIDs)

                            // Auditor table (header)
                            updateTicketsToAuditBanner({ auditor, ticketNumber: auditorTicketIDs.length })

                            // Summary table
                            updateSummaryTable(assignments)

                        },
                        error_notificate: (message, consoleMethod = "log") => {
                            console[consoleMethod](message)
                            createNotification({
                                message: `Could not assign ticket: ${message}`,
                                emoji: "⚠️",
                                shakeAnimation: true
                            })
                        },
                        updateLinks: (auditor, auditorTicketIDs) => {
                            const simURL = createSimURL(auditorTicketIDs)
                            const customURL = createCustomURL(auditorTicketIDs)
                            const links = Array.from(section.querySelectorAll(`details[auditor="${auditor}"] .links-rack a`))
                            const customToolLink = links.find(link => link.href.includes(customToolTicketId))
                            const simLink = links.find(link => link.href.includes("amazon.com/issues?q"))
                            if (customToolLink) {
                                customToolLink.href = customURL
                            } else {
                                createNotification({
                                    message: `Custom tool link not found for auditor ${auditor}, and it was not updated with the new ticket`,
                                    emoji: "⚠️",
                                    shakeAnimation: true
                                })
                            }
                            if (simLink) {
                                simLink.href = simURL
                            } else {
                                createNotification({
                                    message: `SIM search link not found for auditor ${auditor}, and it was not updated with the new ticket`,
                                    emoji: "⚠️",
                                    shakeAnimation: true
                                })
                            }
                        }
                    }

                    const associateActionAreas = Array.from(document.querySelectorAll(".associate-actions-area"))
                    associateActionAreas.forEach(associateActionArea => {
                        const assignNewTicketButton = associateActionArea.querySelector(".assign-new-ticket")

                        // hacer un dropdown con los auditors
                        addContextMenus(".contextMenu-trigger > button")

                        // al hacer click en el auditor, asignar el ticket
                        const auditorOptions = Array.from(associateActionArea.querySelectorAll(".contextMenu li"))
                        auditorOptions.forEach(auditorOption => {
                            auditorOption.addEventListener("click", ({ target }) => {
                                const auditor = target.getAttribute("auditor")
                                const associate = assignNewTicketButton.getAttribute("associate")
                                extraTicketActions.assignExtraTicket(associate, auditor)
                                associateActionArea.querySelector(".contextMenu").classList.add("hidden")
                            })
                        })

                        /*assignNewTicketButton.addEventListener("click", () => {
    
                        })*/
                    })
                }

            }

            function updateSummaryTable(assignments) {
                const sumArray = (array) => array.reduce((acc, curr) => acc + curr, 0)

                // Prepare data
                const flatAssignments = Object.values(assignments).flat()
                // TO DO: some of the assignments do not have an "extraFeatures" property. Find out why.
                const getFeatures = (type) => flatAssignments.filter(assignedTicket => {
                    return assignedTicket.extraFeatures && assignedTicket.extraFeatures.includes(type)
                }).length
                const quantities = {
                    total: flatAssignments.length,
                    extra: getFeatures("extra"),
                    adHoc: getFeatures("manual-must-audit"),
                    unqFail: getFeatures("unq-fail-must-audit"),
                    handPicked: getFeatures("handpicked"),
                }
                const quantityRegular = 2 * quantities.total - (sumArray(Object.values(quantities)))

                const assignmentTypes = [
                    {
                        title: "Total",
                        value: quantities.total,
                        description: "Total quantity of tickets assigned."
                    },
                    {
                        title: "Extra",
                        value: quantities.extra,
                        description: `Tickets that were assigned over 3 for specific because as specified in the Excel file "${FILE_NAMES.CUSTOM_AUDITS}".`,
                        color: "red"
                    },
                    {
                        title: "Ad hoc",
                        value: quantities.adHoc,
                        description: `Tickets that were manually picked to be audited (tagged with "${TAG_NAMES.DO_AUDIT}").`,
                        color: "red"
                    },
                    {
                        title: "Unquarantine fail",
                        value: quantities.unqFail,
                        description: `Tickets that were assigned because they have unquarantine fail (tagged with "${TAG_NAMES.UNQ_FAIL}").`,
                        color: "red"
                    },
                    {
                        title: "Hand-picked",
                        value: quantities.handPicked,
                        description: `Tickets that were manually assigned by clicking on an "Assign new ticket" button for an associate (in the table below).`,
                        color: "yellow"
                    },
                    {
                        title: "Regular",
                        value: quantityRegular,
                        description: `Tickets assigned randomly.`,
                        color: "green"
                    },
                ]

                // Create and append HTML
                const introDiv = Object.assign(document.createElement("span"), { textContent: "Tickets assigned by type:" })

                const summaryTable = document.createElement("dl")
                summaryTable.innerHTML = assignmentTypes.map(({ title, value, description }) => `<dt>${title}</dt><dd>${value}</dd><span>${description}</span>`).join("")

                const container = document.querySelector(".summary-table")
                container.innerHTML = ""
                container.append(introDiv, summaryTable)

                //createSummaryChart([6, 2, 5, 156])
                createSummaryChart(assignmentTypes)
            }

            function createSummaryChart(assignmentTypes) {
                // Remove the "Total" type
                const dataWithoutTotal = assignmentTypes.filter(t => t.title !== "Total")

                // Colors
                const colors = generatePalette(assignmentTypes.length)
                dataWithoutTotal.forEach((type, i) => type.color = colors[i])

                // Create chart
                const chart = new Chart("chart-area", dataWithoutTotal)
                chart.render()
            }


            /////// AUDITOR ASSIGNMENTS ///////
            function displayAssignments(assignmentsContainer, assignments, auditors) {
                assignmentsContainer.innerHTML = ""
                for (const auditor in assignments) {
                    const auditorTickets = assignments[auditor]
                    const auditorLanguages = auditors[auditor].join(", ")
                    const auditorTicketIDs = auditorTickets.map(ticketData => ticketData.ticket)

                    const detailsElement = document.createElement("details")
                    detailsElement.classList.add("audit-assignments")
                    detailsElement.setAttribute("auditor", auditor)

                    // Create header
                    const summaryElement = document.createElement("summary")
                    summaryElement.classList.add("audit-assignments-auditor-header")

                    const ticketsToAuditText = updateTicketsToAuditBanner({ auditor, ticketNumber: auditorTickets.length, justReturnHTML: true })
                    summaryElement.innerHTML = `
                            <img src="https://internal-cdn.amazon.com/badgephotos.amazon.com/?uid=${auditor}" class="badge-img"></img>
                            <div>${auditor}</div>
                            <div class="tickets-to-audit">${ticketsToAuditText}</div>
                            <div>${auditorLanguages}</div>`

                    detailsElement.appendChild(summaryElement)


                    // Create body
                    const contents = document.createElement("div")
                    contents.classList.add("audit-assignments-auditor-body")

                    const linksRack = createLinksRack(auditorTicketIDs)
                    const tableElement = createAuditorTable(auditor, auditorTickets)

                    contents.append(linksRack, tableElement)
                    detailsElement.appendChild(contents)

                    // Apend all
                    assignmentsContainer.appendChild(detailsElement)
                }
            }

            function updateTicketsToAuditBanner({ auditor, ticketNumber, justReturnHTML = false }) {
                const html = `${ticketNumber} tickets to audit`
                if (justReturnHTML) return html
                const element = document.querySelector(`details[auditor='${auditor}'] .tickets-to-audit`)
                element.innerHTML = html
            }

            function createAuditorTable(auditor, auditorTickets) {
                const auditorTable = document.createElement("ol")
                auditorTable.setAttribute("auditor", auditor)
                const nodes = auditorTickets.map(getAuditedTicketNodeAuditorTable)
                auditorTable.append(...nodes)
                return auditorTable
            }

            function getAuditedTicketNodeAuditorTable({ associate, ticket, marketplace }) {
                const innerHTML = [
                    `<span>${getFlagEmoji(marketplace)}</span>`,
                    `<a href="https://t.corp.amazon.com/${ticket}" target="_blank" rel="noopener noreferrer">${ticket}</a>`,
                    `<span>${associate}</span>`,
                ].join("&nbsp;")
                return create("li", { innerHTML })
            }

            function createLinksRack(auditorTicketIDs) {
                const linksRack = document.createElement("div")
                linksRack.textContent = "See remaining audits: "
                linksRack.classList.add("links-rack")
                const links = [
                    createSIMLink(auditorTicketIDs),
                    createCustomLink(auditorTicketIDs)
                ]
                links.forEach(link => {
                    const linkContainer = document.createElement("span")
                    linkContainer.appendChild(link)
                    linksRack.appendChild(linkContainer)
                })
                return linksRack
            }

            function createCustomLink(ticketIDs) {
                const link = document.createElement("a")
                const href = createCustomURL(ticketIDs)
                link.setAttribute("href", href)
                link.setAttribute("target", "_blank")
                link.textContent = "In a custom tool"
                return link
            }

            function createSIMLink(ticketsToAudit) {
                const url = createSimURL(ticketsToAudit)
                if (!url) {
                    console.error("Could not create URL")
                    return null
                }
                const link = document.createElement("a")
                link.setAttribute("href", url)
                link.setAttribute("target", "_blank")
                link.innerHTML = "In a SIM search"
                return link
            }

            function createCustomURL(ticketsToAudit) {
                const BASE_URL = `https://t.corp.amazon.com/${customToolTicketId}`
                const hash = ticketsToAudit.join(",")
                return `${BASE_URL}#${hash}`
            }

            function createSimURL(ticketsToAudit) {
                const BASE_URL = `https://t.corp.amazon.com/issues?q=`

                const buildNestedORStructure = (arr) => {
                    if (arr.length < 1) return null
                    if (arr.length === 1) return arr[0]
                    return {
                        "OR": [
                            arr[0],
                            buildNestedORStructure(arr.slice(1))
                        ]
                    }
                }
                // console.log({ groups })
                const assignedGroupsSearchQuery = JSON.stringify(buildNestedORStructure(groups), null)

                /*const searchParameters = {
                    "NOT": {
                        "keyword": `(${ticketsToAudit.join(" OR ")})`,
                        "NOT": {
                            "tags": "CS Andon Cord Audited", // not QA audited
                            "NOT": {
                                "containingFolder": "a556c580-cc7a-42c0-bd22-78d763f514c4", // not a QA ticket
                                "labels": "0de4225f-5359-41d4-9c5c-644bda4152f2" // not a SR ticket
                            }
                        }
                    }
                }*/
                /*const searchParameters = {
                    NOT: {
                        keyword: `(${ticketsToAudit.join(" OR ")}`,
                        NOT: {
                            tags: "CS Andon Cord Audited", // not QA audited
                            NOT: {
                                containingFolder: "a556c580-cc7a-42c0-bd22-78d763f514c4", // not a QA ticket
                                AND: {
                                    labels: "0de4225f-5359-41d4-9c5c-644bda4152f2", // not a SR ticket
                                    assignedGroup: assignedGroupsSearchQuery
                                }
                            }
                        }
                    }
                }
                const searchParametersString = JSON.stringify(searchParameters)
                */
                // TO DO: get assigned groups dynamically from assignedGroupsSearchQuery

                const searchParametersString = `{"NOT":{"keyword":"(${ticketsToAudit.join(" OR ")})","NOT":{"tags":"CS Andon Cord Audited","NOT":{"containingFolder":"a556c580-cc7a-42c0-bd22-78d763f514c4","AND":{"labels":"0de4225f-5359-41d4-9c5c-644bda4152f2","assignedGroup":{"OR":["FBA Andon DE",{"OR":["MFN Andon DE",{"OR":["FBA Andon BE",{"OR":["FBA Andon BR",{"OR":["FBA Andon DE Reinstatement",{"OR":["FBA Andon ES",{"OR":["FBA Andon ES Reinstatement",{"OR":["FBA Andon FR",{"OR":["FBA Andon FR Reinstatement",{"OR":["FBA Andon IT",{"OR":["FBA Andon IT Reinstatement",{"OR":["FBA Andon MX",{"OR":["FBA Andon NL",{"OR":["FBA Andon PL",{"OR":["FBA Andon SE",{"OR":["FBA Andon TR",{"OR":["FBA Andon UK",{"OR":["FBA Andon UK Reinstatement",{"OR":["MFN Andon BE",{"OR":["MFN Andon DE",{"OR":["MFN Andon ES",{"OR":["MFN Andon FR",{"OR":["MFN Andon IT",{"OR":["MFN Andon MX",{"OR":["MFN Andon NL",{"OR":["MFN Andon PL",{"OR":["MFN Andon SE",{"OR":["MFN Andon TR",{"OR":["MFN Andon UK",{"OR":["FBA WIR Andon DE",{"OR":["FBA WIR Andon NL",{"OR":["FBA WIR Andon PL",{"OR":["FBA WIR Andon SE",{"OR":["FBA WIR Andon TR","bcn-cs-andon-team"]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}]}}}}}}`

                const searchParametersUrl = encodeURIComponent(searchParametersString)
                return BASE_URL + searchParametersUrl
            }
        },
    ).render()
}



