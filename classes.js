class Loader {
    constructor() {
        this.parentNode = document.querySelector("main")
        this.loaderElement = null
        this.progressBar = null
        this.stateText = null
        this.max = null
    }

    createLoader(text) {
        this.loaderElement = document.createElement("div")
        this.loaderElement.classList.add("loader")

        this.progressBar = document.createElement("progress")
        this.progressBar.value = 0
        this.progressBar.max = 0

        this.stateText = document.createElement("div")

        this.stateText.innerHTML = text
            .split("\n")
            .map(line => `<div style="text-align: center;">${line}</div>`)
            .join("")
        this.loaderElement.append(this.progressBar, this.stateText)

        this.parentNode.appendChild(this.loaderElement)
    }

    setMax(max) {
        this.progressBar.max = max
    }

    updateProgress(value, text) {
        this.progressBar.value = value
        this.stateText.innerHTML = text
            .split("\n")
            .map(line => `<div style="text-align: center;">${line}</div>`)
            .join("")
    }

    closeLoader() {
        setTimeout(() => {
            this.loaderElement.style.opacity = 0
            setTimeout(() => {
                this.parentNode.removeChild(this.loaderElement)
            }, 500)
        }, 500)
    }
}

class Section {
    static instances = []
    // static instances = {} // Trying with a simple array now. Let this here in case object becomes more useful

    constructor(tab, id, title, { chartData }, html, script) {
        this.title = title
        this.html = html
        this.script = script
        this.tab = tab
        this.id = id
            .replace(/[\s]/g, "-")
            .replace(/[\,\.\'\"]/g, "")
            .toLowerCase()
        this.chartData = chartData
        //Section.instances[this.tab] ? Section.instances[this.tab].push(this) : Section.instances[this.tab] = [this]
        Section.instances.push(this)
    }

    render() {
        let section, heading, content
        if (!document.querySelector("#" + this.id)) {
            section = document.createElement("section")
            section.setAttribute("id", this.id)
            heading = document.createElement("h2")
            content = document.createElement("div")
            content.classList.add("section-content")
            section.append(heading, content)
            const tabNode = document.querySelector("main #" + this.tab)
            if (!tabNode) {
                console.error(`Tab ${this.tab} is not in the document.`)
                return
            }
            tabNode.appendChild(section)
        } else {
            section = document.querySelector("#" + this.id)
            heading = section.querySelector("h2")
            content = section.querySelector("div.section-content")
        }
        heading.innerHTML = this.title
        content.innerHTML = this.html
        this.script(section, this)
    }

    /*reload({ chartData }) {
          this.chartData = chartData
          const section = document.querySelector("#" + this.id)
          const content = section.querySelector(".section-content")
          content.innerHTML = this.html
          this.script(section, this)
      }*/
}

class TicketFilter {
    constructor(data, teamDatabase) {
        this.data = this.cleanInputKeys(data)
        this.teamDatabase = teamDatabase
        // let team = prompt("Please enter the SUP's login id");
        // this.teamDatabase = getAssociatesByTeam(team);
    }

    // Private methods
    /*cleanLogin(grossLogin) {
          return grossLogin.replace("kerberos:", "").replace("@ANT.AMAZON.COM", "")
      }*/
    cleanInputKeys(input) {
        const cleanedInput = {}
        for (const key in input) {
            const cleanedKey = key.replace("kerberos:", "").replace("@ANT.AMAZON.COM", "")
            const randomOrderTickets = this.pseudoRandomSort(input[key])
            cleanedInput[cleanedKey] = randomOrderTickets
        }
        return cleanedInput
    }

    getAssociatesByTeam(team) {
        return Object.entries(this.teamDatabase)
            .filter(([_, associateInfo]) => associateInfo[1] === team)
            .map(([associateId, _]) => associateId)
    }

    getTouchesByTeam(associates, filterFn) {
        let touches = []
        for (const associate of associates) {
            touches = touches.concat(filterFn.call(this, associate))
        }
        return touches
    }

    getMondayAndSunday(date) {
        const startDate = new Date(date)
        startDate.setDate(startDate.getDate() - startDate.getDay() + 1)
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 6)
        return [startDate, endDate]
    }

    organizeBinChecks(binChecks) {
        // console.log("THIS REQUIRES BC INFO")
        if (Object.prototype.toString.call(binChecks) === "[object Object]") {
            // console.log("BCs were already organized")
            return binChecks
        }
        const totalBcs = new Set()
        const notFoundInIdMap = new Set()
        const notFoundInTypeMap = new Set()
        const linkTypes = {
            auto_bc: new Set(),
            manu_bc: new Set(),
            mozart: new Set(),
            others: new Set(),
        }
        try {
            binChecks.forEach(bc => {
                // Get shortId of found tickets, if possible
                const shortId = guidRegex.test(bc) ? bcIdMap[bc] || null : bc

                // Organize found tickets
                if (!shortId) {
                    notFoundInIdMap.add(bc)
                    linkTypes.others.add(bc)
                } else if (!bcTypeMap[shortId]) {
                    notFoundInTypeMap.add(shortId)
                    linkTypes.others.add(shortId)
                } else {
                    totalBcs.add(shortId)
                    const { isMozart, isAutomated } = bcTypeMap[shortId]
                    const type = isMozart ? "mozart" : isAutomated ? "auto_bc" : "manu_bc"
                    linkTypes[type].add(shortId)
                }
            })
        } catch (error) {
            // console.log(binChecks)
            console.error(error)
        }

        return linkTypes
    }

    pseudoRandomSort(arr) {
        const createSeededRandom = (seed) => {
            const m = 0xFFFFFFFF
            let x = seed & m
            return function () {
                x = (x * 1664525 + 1013904223) & m
                return x / m
            }
            // These apparently arbitrary numbers are actually common constants for a
            // Linear Congruential Generator that uses a modulus m of 2^32 (which is
            // represented by constant m here), providing long periods and a good
            // distribution of random numbers
        }
        const generateSeed = (arr) => arr.reduce((acc, val) => ((acc << 5) - acc + val) | 0, 0)
        
        const seed = generateSeed(arr)
        const random = createSeededRandom(seed)
        const randomValues = arr.map(val => [val, random()])

        return randomValues.sort((a, b) => a[1] - b[1]).map(pair => pair[0])
    }

    // Public methods
    callFunction(target, timeRange, date) {
        if (target === "team-all") {
            switch (timeRange) {
                case "day":
                    return this.get_allTouches_onDay(date)
                case "week":
                    return this.get_allTouches_onWeek(date)
                default:
                    throw new Error(`Time range '${timeRange}' not supported.`)
            }
        } else if (supervisors.some(supervisor => target === supervisor)) {
            switch (timeRange) {
                case "day":
                    return this.get_subteamTouches_onDay(target, date)
                case "week":
                    return this.get_subteamTouches_onWeek(target, date)
                default:
                    throw new Error(`Time range '${timeRange}' not supported.`)
            }
        } else if (Object.keys(this.teamDatabase).some(associate => target === associate)) {
            switch (timeRange) {
                case "day":
                    return this.get_associateTouches_onDay(target, date)
                case "week":
                    return this.get_associateTouches_onWeek(target, date)
                default:
                    throw new Error(`Time range '${timeRange}' not supported.`)
            }
        } else {
            throw new Error(`Target '${target}' not recognized as an associate, nor a supervisor, nor the full team.`)
        }
    }

    get_associateTouches_onDay(associate, date) {
        if (this.data[associate] && Array.isArray(this.data[associate])) {
            return this.data[associate]
                .filter(touch => touch.touchDate === date)
                .map(touch => {
                    touch.binChecks = this.organizeBinChecks(touch.binChecks)
                    return touch
                })
        }
        return []
    }

    get_associateTouches_onWeek(associate, date) {
        const [monday, sunday] = this.getMondayAndSunday(date)
        if (this.data[associate] && Array.isArray(this.data[associate])) {
            const result = this.data[associate]
                .filter(touch => {
                    const touchDate = new Date(touch.touchDate)
                    return touchDate >= monday && touchDate <= sunday
                })
                .map(touch => {
                    touch.binChecks = this.organizeBinChecks(touch.binChecks)
                    return touch
                })
            return result
        }
        return []
    }

    get_subteamTouches_onDay(team, date) {
        const associates = this.getAssociatesByTeam(team)
        return this.getTouchesByTeam(associates, function (associate) {
            return this.get_associateTouches_onDay(associate, date)
        })
    }

    get_subteamTouches_onWeek(team, date) {
        const associates = this.getAssociatesByTeam(team)
        return this.getTouchesByTeam(associates, function (associate) {
            return this.get_associateTouches_onWeek(associate, date)
        })
    }

    get_allTouches_onDay(date) {
        let touches = []
        for (const associate in this.data) {
            touches = touches.concat(this.get_associateTouches_onDay(associate, date))
        }
        return touches
    }

    get_allTouches_onWeek(date) {
        let touches = []
        for (const associate in this.data) {
            touches = touches.concat(this.get_associateTouches_onWeek(associate, date))
        }
        return touches
    }

    // Chart-specific methods
    // Get data for graph "by associate", both single-day and week
    get_allTouches_arrangedByAssociate_on(date, week = false) {
        const associates = Object.keys(this.teamDatabase)
        const stats = associates.map(associate => {
            const touches = week ? this.get_associateTouches_onWeek(associate, date) : this.get_associateTouches_onDay(associate, date)
            const resolvedTouches = touches.filter(touch => touch.didResolve)
            const unresolvedTouches = touches.filter(touch => !touch.didResolve)
            return {
                associate: associate,
                name: this.teamDatabase[associate][0],
                total: touches.length,
                resolved: resolvedTouches.length,
                unresolved: unresolvedTouches.length,
            }
        })

        stats.sort((a, b) => b.total - a.total)

        const totalArray = stats.map(stat => stat.total)
        const resolvedArray = stats.map(stat => stat.resolved)
        const unresolvedArray = stats.map(stat => stat.unresolved)
        const associateNameArray = stats.map(stat => stat.name)

        return [totalArray, resolvedArray, unresolvedArray, associateNameArray]
    }

    //
    get_resolvedByAssociate_onWeek(date, keys) {
        const [monday, sunday] = this.getMondayAndSunday(date)
        const output = {}
        
        for (const associate in this.data) {
           
            if (!Object.keys(this.teamDatabase).includes(associate)) continue
            output[associate] = keys.reduce(
                (obj, key) => {
                    obj[key] = {}
                    return obj
                },
                { totalResolved: [] },
            )

            this.data[associate].forEach(touch => {
                // Discard non-resolved and non-in-the-given-week tickets
                if (!touch.didResolve) return
                const touchDate = new Date(touch.touchDate)
                if (touchDate < monday || touchDate > sunday) return

                // Process every key
                output[associate].totalResolved.push(touch.ticketId)
                keys.forEach(key => processKey(associate, touch, key))
            })


            //new code
            
            if (!('SUP' in output[associate])) {
                output[associate]['SUP']= this.teamDatabase[associate][1]
              //  console.log(output);
            }
            // end
        }

        function processKey(associate, touch, key) {
            output[associate][key][touch[key]] ??= []
            output[associate][key][touch[key]].push(touch.ticketId)

        }
        
        return output
    }

    get_adHocTickets_onWeek(date) {
        // console.log("this.data", this.data)
        const [monday, sunday] = this.getMondayAndSunday(date)
        const [manualMustAuditTickets, unqFailMustAuditTickets, skipAuditTickets] = [[], [], []]

        for (const associate in this.data) {
            this.data[associate].forEach(touch => {
                // Discard non-resolved and non-in-the-given-week tickets
                if (!touch.mustAuditManual && !touch.mustAuditUnqFail && !touch.skipAudit) return
                if (!touch.didResolve) return
                const touchDate = new Date(touch.touchDate)
                if (touchDate < monday || touchDate > sunday) return

                // Add ticket to corresponding array
                if (touch.mustAuditManual) {
                    manualMustAuditTickets.push(touch)
                    // console.log("mustAuditManual")
                } else if (touch.mustAuditUnqFail) {
                    // console.log("mustAuditUnqFail")
                    unqFailMustAuditTickets.push(touch)
                } else if (touch.skipAudit) {
                    skipAuditTickets.push(touch)
                }
            })
        }

        return [manualMustAuditTickets, unqFailMustAuditTickets, skipAuditTickets]
    }

    get_resolvedList_onWeek(date) {
        const [monday, sunday] = this.getMondayAndSunday(date)
        const output = []

        for (const associate in this.data) {
            if (!Object.keys(this.teamDatabase).includes(associate)) continue
            /*output[associate] = keys.reduce(
                (obj, key) => {
                    obj[key] = {}
                    return obj
                },
                { totalResolved: [] },
            )*/

            this.data[associate].forEach(touch => {
                // Discard non-resolved and non-in-the-given-week tickets
                if (!touch.didResolve) return
                const touchDate = new Date(touch.touchDate)
                if (touchDate < monday || touchDate > sunday) return

                // Process every key
                output.push({
                    login: associate,
                    ticketId: touch.ticketId,
                    marketplace: touch.marketplace,
                    pullType: touch.pullType,
                    rci: touch.rci,
                    //audited: false
                })
            })
        }

        return output
    }
}


class FloatingFeedback {
    static instance;

    constructor() {
        if (FloatingFeedback.instance) {
            FloatingFeedback.instance.floatingFeedbackWrap.classList.remove("fade-out")
            return FloatingFeedback.instance;
        }
        this.floatingFeedbackWrap = this._createFeedback()
        this.spinner = this._createSpinner()

        FloatingFeedback.instance = this;
    }

    updateText(newText) {
        const feedbackNode = this.floatingFeedbackWrap.querySelector("span")
        feedbackNode.innerHTML = newText;
    }

    removeFeedback() {
        this.floatingFeedbackWrap.classList.add("fade-out")
        setTimeout(() => {
            this.floatingFeedbackWrap.remove()
            FloatingFeedback.instance = null // Reset the instance so a new one can be created
        }, 500)
        this.spinner.remove()
    }
    _createFeedback() {
        const floatingFeedbackWrap = document.createElement("div");
        floatingFeedbackWrap.classList.add("floating-feedback");
        const floatingFeedback = document.createElement("span");
        floatingFeedbackWrap.appendChild(floatingFeedback);
        document.body.appendChild(floatingFeedbackWrap);
        return floatingFeedbackWrap
    }
    _createSpinner() {
        const spinner = document.createElement("div")
        spinner.classList.add("spinner-loader")
        document.body.appendChild(spinner)
        return spinner
    }
}


class Chart {
    constructor(selector, data) {
        // console.log({ data })
        this.xmlns = "http://www.w3.org/2000/svg";
        this.xmlnshtml = "http://www.w3.org/1999/xhtml";
        this.viewBoxSize = 300;
        this.center = this.viewBoxSize / 2;
        this.expandSize = 10;
        this.startAngle = 0;
        this.angleStart = 0;
        this.angleEnd = 0;
        this.angleMargin = 0;
        this.expandedIndex = -1;
        this.total = 0;
        this.anglesMap = [];
        this.strokeColor = "#FFFFFF";
        this.strokeWidth = 1;
        this.strokeLinejoin = "round";
        this.transitionDuration = "0.3s";
        this.transitionTimingFunction = "ease-in-out";
        this.el = {
            selector: document.getElementById(selector),
            svg: document.createElementNS(this.xmlns, "svg"),
            circle: document.createElementNS(this.xmlns, "ellipse"),
            sectors: document.createElementNS(this.xmlns, "g")
        };
        this.data = [];

        this.setAttributes = function (el, attrs) {
            for (var key in attrs) {
                el.setAttributeNS(null, key, attrs[key]);
            }
        };

        this.getText = function ({ node, index }) {
            const el = document.createElementNS(this.xmlns, "text");
            this.setAttributes(el, {
                x: 0,
                y: 0,
                fontSize: "0.4em"
            });
            el.innerHTML = node.title;
            return el;
        };

        this.renderSectors = function () {
            return this.data.map((d, i) => {
                const sectorGroupElement = document.createElementNS(this.xmlns, "g");
                const center = this.center;
                const isLarge = (d.value || 0) / this.total > 0.5;
                const angle = (360 * (d.value || 0)) / this.total;
                const radius =
                    (center +
                        (i === this.expandedIndex ? this.expandSize : 0) -
                        this.strokeWidth) *
                    0.5;
                this.angleStart = this.angleEnd;
                this.angleMargin = this.angleMargin > angle ? angle : this.angleMargin;
                this.angleEnd = this.angleStart + angle - this.angleMargin;
                const x1 =
                    center + radius * Math.cos((Math.PI * this.angleStart) / 180);
                const y1 =
                    center + radius * Math.sin((Math.PI * this.angleStart) / 180);
                const x2 = center + radius * Math.cos((Math.PI * this.angleEnd) / 180);
                const y2 = center + radius * Math.sin((Math.PI * this.angleEnd) / 180);
                const path = `
              M${center},${center}
              L${x1},${y1}
              A${radius},${radius}
              0 ${isLarge ? 1 : 0},1
              ${x2},${y2}
              z
            `;
                const $sector = this.renderSector({
                    fill: d.color,
                    path
                });

                const angleMid = (this.angleEnd - this.angleStart) / 2;
                const r2 = radius * 1.2 + 5;
                const a =
                    angleMid + this.anglesMap.slice(0, i).reduce((a, b) => a + b, 0);
                const xMid = center + r2 * Math.cos((Math.PI * a) / 180);
                const yMid = center + r2 * Math.sin((Math.PI * a) / 180);
                const xEnd = xMid > center ? xMid + 20 : xMid - 20;
                const sectorLabelLinePoints = `
            ${center},${center} 
            ${xMid} ${yMid} 
            ${xEnd} ${yMid}
          `;
                const $polyline = document.createElementNS(this.xmlns, "polyline");
                this.setAttributes($polyline, {
                    points: sectorLabelLinePoints,
                    fill: "none",
                    stroke: d.color,
                    strokeWidth: this.strokeWidth
                });
                // text

                // const $text = document.createElementNS(this.xmlns, "text");
                // this.setAttributes($text, {
                //   x: xMid - 3,
                //   y: yMid - 3,
                //   "font-size": "0.7em",
                //   "text-anchor": xMid < center || xEnd < yMid ? "end" : "start"
                // });
                // $text.innerHTML = d.title;

                // <foreignObject x="20" y="90" width="150" height="200">
                //   <p xmlns="http://www.w3.org/1999/xhtml">Text goes here</p>
                // </foreignObject>

                const $textBox = document.createElementNS(this.xmlns, "foreignObject");
                this.setAttributes($textBox, {
                    x: xMid > center ? xEnd : xEnd - 100,
                    y: yMid - 20,
                    width: 100,
                    height: 200
                });
                $textBox.style.display = "flex"

                const $text = document.createElementNS(this.xmlnshtml, "span");
                $text.classList.add("chart-label")
                $text.style.textAlign = xMid <= center ? "right" : "left";
                $text.textContent = d.title;
                $textBox.appendChild($text);

                // end of text
                sectorGroupElement.appendChild($sector);
                sectorGroupElement.appendChild($polyline);
                sectorGroupElement.appendChild($textBox);
                return sectorGroupElement;
            });
        };

        this.renderSingleData = function () {
            const [d] = this.data;
            this.setAttributes(this.el.circle, {
                cx: this.center,
                cy: this.center,
                fill: d?.color || "#ddd",
                rx: this.center / 2,
                ry: this.center / 2
            });
            this.el.sectors.appendChild(this.el.circle);
        };

        this.renderMultipleData = function () {
            // console.log("renderMultipleData")
            const sectors = this.renderSectors();
            sectors.forEach((sector) => this.el.sectors.appendChild(sector));
        };

        this.renderSector = function (props) {
            const { fill, path: d } = props;
            const path = document.createElementNS(this.xmlns, "path");
            this.setAttributes(path, {
                d,
                fill,
                stroke: this.strokeColor,
                strokeWidth: this.strokeWidth,
                strokeLinejoin: this.strokeLinejoin
            });
            return path;
        };

        this.init = function () {
            this.setAttributes(this.el.svg, {
                viewBox: `-50 -50 400 400`,//`0 0 ${this.viewBoxSize} ${this.viewBoxSize}`,
                width: this.viewBoxSize,
                height: this.viewBoxSize,
                style: "display: block;margin: -4rem 0;"
            });
            this.el.svg.appendChild(this.el.sectors);
            data.forEach((d) => d.value > 0 && this.data.push(d));
            this.data.forEach((d) => (this.total += parseInt(d.value || 0, 10)));
            this.data.forEach((d) =>
                this.anglesMap.push((360 * d.value) / this.total)
            );
        };

        this.deploy = function () {
            this.el.selector.innerHTML = "";
            this.el.selector.appendChild(this.el.svg);
        };

        this.render = function () {
            this.init();
            this.data.length > 1
                ? this.renderMultipleData()
                : this.renderSingleData();
            this.deploy();
        };
    }
}