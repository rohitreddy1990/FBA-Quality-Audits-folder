function getWeeksLists(timeRange, numberOfTimeUnits, currentWeek, availableWeeks, date) {
    // console.log(availableWeeks)
    let allTimeUnitsInSpan = []
    let includedWeeks

    // Get a list of the days/weeks (for the labels)
    if (timeRange === "day") {
        const weeks = new Set()
        const parsedDate = new Date(date)
        for (let i = 0; i < numberOfTimeUnits; i++) {
            const currentDate = new Date(addDays(parsedDate, -i))
            const day = currentDate.getDay()

            if (!showOnlyWeekdays || (day >= 1 && day <= 5)) {
                allTimeUnitsInSpan.push(new Date(currentDate))
                const weekNumber = getYearWeek(currentDate)
                weeks.add(`${currentDate.getFullYear()}W${weekNumber.toString().padStart(2, "0")}`)
            }
        }
        includedWeeks = Array.from(weeks)
    } else if (timeRange === "week") {
        const [currentWeekYear, currentWeekNumber] = currentWeek.split("W").map(e => parseInt(e))
        for (let i = 0; i < numberOfTimeUnits; i++) {
            const weekNumber = currentWeekNumber - i
            let year = currentWeekYear
            let formattedWeekNumber = weekNumber
            if (weekNumber <= 0) {
                year--
                formattedWeekNumber = weekNumber + 52
            }
            const week = year + "W" + formattedWeekNumber.toString().padStart(2, "0")
            allTimeUnitsInSpan.push(week)
        }
        includedWeeks = allTimeUnitsInSpan
    }

    // Get lists of the available/unavailable weeks in the selected days/weeks
    const availableWeeksInSpan = []
    const unavailableWeeksInSpan = []
    for (let i = 0; i < includedWeeks.length; i++) {
        const currentWeek = includedWeeks[i]
        if (availableWeeks.includes(currentWeek)) availableWeeksInSpan.push(currentWeek)
        else unavailableWeeksInSpan.push(currentWeek)
    }

    // Returns a list of the past X weekdays / weeks, a list of the weeks of those days that we have in the database, and a list of the weeks of those days that we don't have in the database
    return [allTimeUnitsInSpan, availableWeeksInSpan, unavailableWeeksInSpan]
}

function toIsoDate(date) {
    const isDate = date && Object.prototype.toString.call(date) === "[object Date]" && !isNaN(date)
    if (isDate) return date.toISOString().split("T")[0]
    else return new Date(date).toISOString().split("T")[0]
}

function addDays(date, days) {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
}

// This function takes a date and returns an array of the days of that week from Sunday to Saturday. Please make it return the days of that week from Monday to Sunday.

/*function isDateBetween(dateToCheck, startDate, endDate) {
      const checkDate = new Date(dateToCheck.getFullYear(), dateToCheck.getMonth(), dateToCheck.getDate())
      const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
      const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
      return checkDate >= start && checkDate <= end
  }*/
function isDateBetween(dateToCheck, startDate, endDate) {
    const checkDate = dateToCheck.getTime()
    const start = startDate.getTime()
    const end = endDate.getTime() + 24 * 60 * 60 * 1000 - 1
    return checkDate >= start && checkDate <= end
}

function getMonday(input) {
    if (/\d{4}W\d{2}/.test(input)) {
        const [year, week] = input.split("W").map(e => parseInt(e))
        const firstDayOfYear = new Date(year, 0, 1)
        const daysToAdd = (week - 1) * 7 + ((8 - firstDayOfYear.getDay()) % 7)
        return new Date(year, 0, 1 + daysToAdd)
    }
    const date = new Date(input)
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(date.setDate(diff))
    return monday
}

function getDaysOfWeek(week, onlyWeekdays = true) {
    const startDate = getMonday(week)
    const days = []
    const lastDay = onlyWeekdays ? 5 : 7
    for (let i = 0; i < lastDay; i++) {
        const currentDate = new Date(startDate)
        currentDate.setDate(startDate.getDate() + i)
        days.push(currentDate)
    }
    return days
}

function gettimeRangeLimits(date, timeRange) {
    date = new Date(date)
    if (timeRange === "day" || timeRange === "week") {
        const day = date.getDay()
        const mondayDate = new Date(date.valueOf())
        mondayDate.setDate(date.getDate() - day + (day === 0 ? -6 : 1))
        const fridayDate = new Date(mondayDate.valueOf())
        fridayDate.setDate(mondayDate.getDate() + 4)
        return [mondayDate, addDays(fridayDate, 1)]
    } else if (timeRange === "month") {
        const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
        const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        return [firstDayOfMonth, addDays(lastDayOfMonth, 1)]
    } else if (timeRange === "year") {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
        const lastDayOfYear = new Date(date.getFullYear(), 11, 31)
        return [firstDayOfYear, addDays(lastDayOfYear, 1)]
    } else {
        gettimeRangeLimits(date, prompt('Please insert a correct date range: "day", "week", "month" or "year".'))
    }
}

function getMondayAndSunday(date) {
    const startDate = new Date(date)
    startDate.setDate(startDate.getDate() - startDate.getDay() + 1)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 6)
    return [startDate, endDate]
}

function getWeekDates(inputDate) {
    const date = new Date(inputDate)
    const dayOfWeek = date.getDay()
    const mondayDay = addDays(date, dayOfWeek === 0 ? -6 : -dayOfWeek + 1)

    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    const weekDates = []
    for (let i = 0; i < 7; i++) {
        const thisDayDate = addDays(mondayDay, i)
        weekDates.push(daysOfWeek[thisDayDate.getDay() === 0 ? 6 : thisDayDate.getDay() - 1] + " " + toIsoDate(thisDayDate).slice(5))
    }
    return weekDates
}

function getYearWeek(date) {
    // Returns a Number, such as 5
    const oneJan = new Date(date.getFullYear(), 0, 1)
    return Math.ceil(((date - oneJan) / 86400000 + oneJan.getDay() + 1) / 7)
}

function getYearAndYearWeek(dateString) {
    // Returns a String, such as 2023W05
    const date = new Date(dateString)
    const weekNumber = getYearWeek(date)
    return `${date.getFullYear()}W${String(weekNumber).padStart(2, "0")}`
}

function areInSameWeek(date1, date2) {
    date1 = new Date(date1)
    date2 = new Date(date2)
    const oneDayMs = 24 * 60 * 60 * 1000
    const dayOfWeekMs = 6 * oneDayMs
    const startOfWeek1 = new Date(date1.getTime() - date1.getDay() * oneDayMs)
    const startOfWeek2 = new Date(date2.getTime() - date2.getDay() * oneDayMs)
    const diffMs = Math.abs(startOfWeek1.getTime() - startOfWeek2.getTime())
    return diffMs < dayOfWeekMs
}


/*function removeDuplicateTouchesMap(teamMetrics) {
      // Cuando hay más de un comentario en un día (mismo ticket y mismo día; por ejemplo, en BC expansion), contar solo el primero, en lugar de varios touches
      for (const [associate, data] of teamMetrics.entries()) {
          const ticketTouches = {}
          const ticketTouchesArray = []
          data.forEach((ticketData) => {
              const uniqueKey = ticketData.ticketId + ticketData.touchDate
              if (!ticketTouches[uniqueKey]) {
                  ticketTouches[uniqueKey] = true
                  ticketTouchesArray.push(ticketData)
              }
          })
          teamMetrics.set(associate, ticketTouchesArray)
      }
      return teamMetrics
  }*/

function sureMatch(regex, findIn, i = 0) {
    return regex.test(findIn) ? findIn.match(regex)[i] : ""
}

function waitForElement(selector, disconnect = false) {
    // CAUTION: this observer doesn't disconnect by default.
    return new Promise(resolve => {
        if (document.querySelector(selector)) return resolve(document.querySelector(selector))
        let observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector))
                if (disconnect) observer.disconnect()
            }
        })
        observer.observe(document.body, { childList: true, subtree: true })
    })
}

async function cacheData(key, value) {
    const db = await getDatabase()
    const tx = db.transaction(["cache"], "readwrite")
    tx.objectStore("cache").put(value, key)
    await tx.complete
}

async function getCachedData(key) {
    const db = await getDatabase()
    const tx = db.transaction(["cache"], "readonly")
    const value = await tx.objectStore("cache").get(key)
    return value
}

async function getDatabase() {
    return new Promise(resolve => {
        const request = indexedDB.open("myDatabase", 1)
        request.onupgradeneeded = event => {
            const db = event.target.result
            db.createObjectStore("cache")
        }
        request.onsuccess = () => {
            const db = request.result
            resolve(db)
        }
        request.onerror = event => {
            console.error("Failed to open database:", event.target.error)
        }
    })
}

async function createObjectStore() {
    const db = await getDatabase()
    const tx = db.transaction(["cache"], "readwrite")
    tx.objectStore("cache")
    await tx.complete
}

/*async function getDatabase() {
      return new Promise((resolve) => {
          const request = indexedDB.open("myDatabase", 1)
          request.onupgradeneeded = (event) => {
              const db = event.target.result
              db.createObjectStore("cache")
          }
          request.onsuccess = () => {
              const db = request.result
              resolve(db)
          }
      })
  }*/


function generatePalette(numberOfColors) {
    const colors = []
    const goldenAngle = 137.5

    // Initialize hue in blue
    let hue = 204.5

    for (let i = 0; i < numberOfColors; i++) {
        hue = (hue + goldenAngle) % 360
        const saturation = 59
        const lightness = 42

        colors.push(`hsl(${Math.floor(hue)}, ${saturation}%, ${lightness}%)`)
    }

    return colors
}

function generatePalette(numberOfColors, saturation = 59, lightness = 42) {
    const colors = [];
    const GOLDEN_ANGLE = 137.5;
    const INITIAL_HUE = 204.5;

    let hue = INITIAL_HUE;

    for (let i = 0; i < numberOfColors; i++) {
        hue = (hue + GOLDEN_ANGLE) % 360;
        colors.push(`hsl(${Math.floor(hue)}, ${saturation}%, ${lightness}%)`);
    }

    return colors;
}


function findCountryShortName(ticketExtensionsTt) {
    const countryShortNameRegEx =
        /\bUS\b|\bUK\b|\bDE\b|\bFR\b|\bJP\b|\bCA\b|\bCN\b|\bIT\b|\bES\b|\bIN\b|\bRU\b|\bAU\b|\bNL\b|\bAE\b|\bSA\b|\bTR\b|\bBR\b|\bMX\b|\bSG\b|\bZA\b|\bNG\b|\bEG\b|\bBE\b|\bSE\b|\bPL\b|\bCO\b|\bCL\b/ // I.e., new RegExp(`\\b${Object.keys(countryData).join("\\b|\\b")}\\b`)
    const possiblePlacesToFindCountry = [ticketExtensionsTt.type, ticketExtensionsTt.assignedGroup, ticketExtensionsTt.building]
    for (const possiblePlace of possiblePlacesToFindCountry) {
        if (countryShortNameRegEx.test(possiblePlace)) {
            return possiblePlace.match(countryShortNameRegEx)[0]
            break
        }
    }
    return null
}

function detectPullType(ticketTitle) {
    const pullTypeDetectors = [
        ["MFN", /\bMFN\b|\bMfn\b|\bTEXT BASED\b/],
        ["Manual", /\bManual\b|\bCaracaraManualPull\b/],
        ["Apollo", /\bapollo\b/i],
        ["RTPCX", /\bRTPCX\b/],
        ["CS Andon", /\bCS_ANDON\b/],
        ["SeSu", /\bSeSu\b/],
    ]
    for (let i = 0; i < pullTypeDetectors.length; i++) {
        if (pullTypeDetectors[i][1].test(ticketTitle)) {
            const foundPullType = pullTypeDetectors[i][0]
            // pullTypeCount[foundPullType]++ // TO DO: count ticket type totals for statistics
            return foundPullType
        }
    }
    return "Not detected"
}

async function processDataByType(response, type) {

    const parsingByType = {
        json: async (response) => await response.json(),
        csv: async (response) => {
            const text = await response.text();

            let insideQuote = false;
            let field = '';
            let rows = [[]];

            const handlers = {
                '"': () => insideQuote = !insideQuote,
                ',': () => {
                    if (insideQuote) {
                        field += ',';
                    } else {
                        rows[rows.length - 1].push(field);
                        field = '';
                    }
                },
                '\n': () => {
                    if (insideQuote) {
                        field += '\n';
                    } else {
                        if (field.endsWith('\r')) {
                            field = field.slice(0, -1);
                        }
                        rows[rows.length - 1].push(field);
                        rows.push([]);
                        field = '';
                    }
                },
                'default': (char) => field += char

            };

            for (let char of text) {
                (handlers[char] || handlers.default)(char);
            }

            if (field) {
                rows[rows.length - 1].push(field);
            }

            const headers = rows[0];
            return rows.slice(1).map(row => headers.reduce((acc, key, idx) => ({ ...acc, [key]: row[idx] }), {}));
        }
    }
    const data = await parsingByType[type.toLowerCase()](response)
    return data
}

async function fetchFile(filename, fileExtension, reportErrors = true) {
    try {
        const response = await fetch(`./database/${filename}.${fileExtension}`)
        if (!response.ok && reportErrors) {
            throw new Error(`HTTP error fetching ${filename}. Status: ${response.status}`)
        }
        const data = await processDataByType(response, fileExtension)
        // if (reportErrors) {
        //     console.log(`Fetched ${filename} from database:`, data)
        // }
        return data
    } catch (error) {
        if (reportErrors) console.error(`Error fetching ${filename}:`, error)
    }
}

async function fetchAllWeeks(today) {
    const currentWeekNumber = parseInt(getYearAndYearWeek(new Date()).slice(-2))

    const years = Array.from(
        {
            length: today.getFullYear() - searchFrom + 1,
        },
        (_, i) => searchFrom + i,
    )

    const weeks = year =>
        Array.from(
            {
                length: year === today.getFullYear() ? currentWeekNumber : 53,
            },
            (_, i) => (i + 1).toString().padStart(2, "0"),
        )

    const allWeeks = years.map(year => weeks(year).map(week => `${year}W${week}`)).flat()

    /*const years = Array.from(
        { length: today.getFullYear() - searchFrom + 1 },
        (_, i) => searchFrom + i,
    )
    const weeks = Array.from({ length: 53 }, (_, i) =>
        (i + 1).toString().padStart(2, "0"),
    )
    const allWeeks = years
        .map(year => weeks.map(week => `${year}W${week}`))
        .flat()*/

    const touchDatabase = []
    let notFoundWeeks = []
    /*for (const filename of allWeeks) {
        floatingFeedback.updateText(`Fetching week ${filename}...`)
        try {
            const jsonData = await fetchJSON(filename, false)
            if (jsonData) {
                touchDatabase.push(jsonData)
            }
        } catch (error) {
            notFoundWeeks.push(filename)
        }
    }*/
    const fetchWeekData = async (filename) => {
        try {
            const jsonData = await fetchFile(filename, "json", false);
            if (jsonData) {
                return { data: jsonData, error: null, filename };
            }
            return { data: null, error: null, filename };
        } catch (error) {
            return { data: null, error, filename };
        }
    }

    const promises = allWeeks.map((filename) => fetchWeekData(filename));

    try {
        const results = await Promise.all(promises);

        for (const result of results) {
            if (result.data) {
                touchDatabase.push(result.data);
            }
            if (result.error) {
                notFoundWeeks.push(result.filename);
            }
        }
    } catch (error) {
        // Handle any unforeseen error here
        console.error('An unexpected error occurred:', error);
    }

    return touchDatabase
}

function getFlagEmoji(countryCode) {
    const countryNameMapping = {
        UK: "GB",
        EG: "EG"
    }
    const codePoints = (countryNameMapping[countryCode] || countryCode)
        .toUpperCase()
        .split("")
        .map(char => 127397 + char.charCodeAt())
    return String.fromCodePoint(...codePoints)
}

function downloadCSV(input, filename) {
    const csvHeaders = Object.keys(input[0]).join(",") + "\n"
    const csvData = input.map(row => Object.values(row).join(",")).join("\n")
    const csvContent = csvHeaders + csvData

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = filename + ".csv"
    document.body.appendChild(link)

    link.click()
    document.body.removeChild(link)
}

function getSupervisorTeamMembers(supervisor, teamDatabase) {
    let supervisorTeamMembers = {}
    for (let associate in teamDatabase) {
        if (teamDatabase[associate][1] === supervisor) {
            supervisorTeamMembers[associate] = teamDatabase[associate]
        }
    }
    return supervisorTeamMembers
}

function createNotification({ message, timeout = 4000, emoji, shakeAnimation }) {
    const NOTIFICATION_CLASSNAME = "notification-banner";
    const container = document.body;

    // Helper function to adjust positions of all notifications when one disappears
    const adjustNotificationPositions = () => {
        const allNotifications = document.querySelectorAll(`.${NOTIFICATION_CLASSNAME}`);
        allNotifications.forEach((notif, index) => {
            const bottomPosition = 15 + (index * 60);  // Assuming average height of 50px + 10px gap
            notif.style.bottom = `${bottomPosition}px`;
        });
    };

    // Create new notification
    const notification = document.createElement("div");
    notification.classList.add(NOTIFICATION_CLASSNAME);
    const emojiArea = document.createElement("div");
    emojiArea.innerHTML = emoji;
    const messageArea = document.createElement("div");
    messageArea.innerText = message;
    notification.append(emojiArea, messageArea);

    // Set initial position of the new notification
    const initialBottomPosition = 15 + (document.querySelectorAll(`.${NOTIFICATION_CLASSNAME}`).length * 60);
    notification.style.bottom = `${initialBottomPosition}px`;

    // Add new notification to the container
    container.appendChild(notification);

    // Trigger the fadeIn animation by adding the class
    setTimeout(() => notification.classList.add("fadeIn"), 0);

    // Remove notification on click and after timeout
    const removeNotification = () => {
        notification.classList.remove("fadeIn");
        notification.classList.add("fadeOut");
        notification.addEventListener("transitionend", () => {
            notification.remove();
            adjustNotificationPositions()
        });
    };

    notification.addEventListener("click", removeNotification);
    setTimeout(removeNotification, timeout);

    // Add shake animation if needed
    if (document.querySelectorAll(`.${NOTIFICATION_CLASSNAME}`).length > 1 && shakeAnimation) {
        notification.classList.add("shake");
        setTimeout(() => notification.classList.remove("shake"), 500);
    }
}




function isNewHire(associate, teamDatabase) {
    const TENURE_DAYS = 6 * 7 // 6 weeks
    const MILLISECONDS_PER_DAY = 86400000
    const tenureLength = TENURE_DAYS * MILLISECONDS_PER_DAY

    const hireDateString = teamDatabase[associate]?.[2]
    // TO DO: check if user is in teamDatabase
    const hireDateParsed = new Date(hireDateString)
    // TO DO: check if date is correct

    const timeAtAmazon = Date.now() - hireDateParsed.getTime()
    const isNewHire = timeAtAmazon < tenureLength
    return isNewHire
}

function create(tag, content, parent = null, callback) {
    const features = typeof content === 'object' ? content : { textContent: content }
    const element = Object.assign(document.createElement(tag), features)
    if (callback) {
        callback(element)
    }
    if (!parent) return element
    parent.appendChild(element)
    return element
}

/* Basic HTML */
function setTabs() {
    const tabs = document.querySelectorAll("[data-tab-target]")
    const tabContents = document.querySelectorAll("[data-tab-content]")
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const target = document.querySelector(tab.dataset.tabTarget)
            tabContents.forEach(tabContent => tabContent.classList.remove("active"))
            tabs.forEach(tab => tab.classList.remove("active"))
            tab.classList.add("active")
            target.classList.add("active")
        })
    })

    const urlTab = new URL(location.href).searchParams.get("tab")
    document.querySelector(`[data-tab-target='#${urlTab}']`)?.click()
}

function removeAnnouncements() {
    waitForElement("footer + div").then(announcement => {
        // console.log("A natively-injected chunk of HTML was removed.")
        announcement.remove()
    })
}

function makeHeaderSticky(section) {
    const sectionContentNode = section.querySelector(".section-content")
    sectionContentNode.style.display = "flex"
    sectionContentNode.style.flexDirection = "column"
    sectionContentNode.style.gap = "20px"
    section.querySelector("h2").classList.add("sticky-h2")
    const headerThrees = section.querySelectorAll("h3")
    for (let i = 0; i < headerThrees.length; i++) {
        headerThrees[i].classList.add("sticky-h3")
    }
}

function addFiltersToTableColumns(section) {
    const headerCells = section.querySelectorAll(".main-table th")
    const filters = new Array(headerCells.length).fill("")
    for (let i = 0; i < headerCells.length; i++) {
        const currentWidth = headerCells[i].offsetWidth
        const searchInput = document.createElement("input")
        searchInput.style.maxWidth = currentWidth - 10 + "px"
        searchInput.setAttribute("type", "text")
        searchInput.addEventListener("input", e => {
            filters[i] = e.target.value
            filterTable()
        })
        const searchInputWrap = document.createElement("div")
        searchInputWrap.appendChild(searchInput)
        headerCells[i].appendChild(searchInputWrap)
    }

    function filterTable() {
        const table = section.querySelector(".main-table")
        const rows = table.querySelectorAll("tr")
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i]
            const shouldDisplay = filters.every((filter, index) => {
                const targetCell = row.cells[index]
                return !filter || targetCell.innerText.toLowerCase().includes(filter.toLowerCase())
            })
            if (!shouldDisplay) row.style.display = "none"
            else row.style.removeProperty("display")
        }
    }
}

function setSearchForm(teamDatabase, date, timeRange) {
    const unitSelectNode = document.querySelector("form.search-form select#unit-input")
    unitSelectNode.querySelector("optgroup[label='Teams']").innerHTML = supervisors
        .map(supervisor => `<option value="${supervisor}">${supervisor}</option>`)
        .join("\n")
    unitSelectNode.querySelector("optgroup[label='Associates']").innerHTML = Object.keys(teamDatabase)
        .sort()
        .map(associate => `<option value="${associate}">${associate}</option>`)
        .join("\n")

    const dateInputNode = document.querySelector("#date-input")
    dateInputNode.setAttribute("max", new Date().toISOString())

    document.querySelector("form input[type='submit']").addEventListener("click", e => {
        e.preventDefault()
        const currentTab = document.querySelector(".tabs .tab.active").getAttribute("data-tab-target").replace("#", "")
        const selectedDate = dateInputNode.value
        //const selectedTimeRange = document.querySelector("input[name='date-range'][checked]").value
        const selectedUnit = unitSelectNode.value
        const radioButtons = Array.from(document.getElementsByName("date-range"))
        const selectedTimeRange = radioButtons.find(rb => rb.checked)?.value
        /*const radioButtons = document.getElementsByName("date-range")
          let selectedtimeRange
          for (let i = 0; i < radioButtons.length; i++) {
              if (radioButtons[i].checked) {
                  selectedtimeRange = radioButtons[i].value
                  break
              }
          }*/
        const queryString = `?date=${selectedDate}&date-range=${selectedTimeRange}&unit=${selectedUnit}&tab=${currentTab}`
        window.history.pushState(null, "", queryString)
        main(selectedDate, selectedTimeRange, selectedUnit, teamDatabase)

        /*// TO DO: getData needs await, but this function cannot be async since there is an e.preventDefault().
          const newTeamMetrics = areInSameWeek(date, selectedDate) ? teamMetrics : getData({ date: new Date(selectedDate), timeRange: selectedtimeRange })
          const newChartData = getChartData(newTeamMetrics, teamDatabase, selectedDate, selectedtimeRange, selectedUnit)
  
          Section.instances.forEach((sectionInstance) => {
              if (sectionInstance.tab === currentTab) sectionInstance.reload({ chartData: newChartData })
          })*/
    })

    const moveDateButtons = document.querySelectorAll(".move-date")
    for (let i = 0; i < moveDateButtons.length; i++) {
        moveDateButtons[i].addEventListener("click", e => {
            e.preventDefault()
            const selectedDate = dateInputNode.value || date
            const selectedTimeRange = Array.from(document.getElementsByName("date-range")).find(rb => rb.checked)?.value || timeRange
            const numberOfDays = selectedTimeRange === "week" ? 7 : 1
            const millisecondsInADay = 24 * 60 * 60 * 1000

            const selectedDateTime = new Date(selectedDate).getTime()
            const direction = e.target.getAttribute("direction")
            const timeOffset = numberOfDays * millisecondsInADay * (direction === "next" ? 1 : -1)
            const newDate = new Date(selectedDateTime + timeOffset)

            //// console.log(selectedDate, selectedTimeRange, numberOfDays, selectedDateTime, direction, toIsoDate(newDate))
            dateInputNode.value = toIsoDate(newDate)
            updateWeekIndicator(newDate)
        })
    }

    function updateWeekIndicator(newDate) {
        document.querySelector("#week-indicator").innerHTML = getYearAndYearWeek(newDate)
    }
}

function kerberosToLogin(kerberos) {
    const LOGIN_REGEX = /kerberos:([a-z]+)@ANT.AMAZON.COM/
    if (!LOGIN_REGEX.test(kerberos)) {
        console.error(`Invalid kerberos login (no match at all): "${kerberos}"`)
        // to do: user feedback
        return ""
    }

    const matches = kerberos.match(LOGIN_REGEX)
    if (matches.length < 2) {
        console.error(`Invalid kerberos login (only 1 match): "${kerberos}"`)
        // to do: user feedback
        return ""
    }

    return matches[1]
}

function shuffle(array) {
    // Fisher-Yates algorithm
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function deterministicShuffle(array, seed) {
    // Mike Bostock's implementation of the Fisher–Yates algorithm

    const random = seed1 => {
        const x = Math.sin(seed1++) * 10000
        return x - Math.floor(x)
    }

    let m = array.length, t, i

    // While there remain elements to shuffle…
    while (m) {
        // Pick a remaining element…
        i = Math.floor(random(seed) * m--)

        // And swap it with the current element.
        t = array[m]
        array[m] = array[i]
        array[i] = t
        ++seed
    }

    return array
}