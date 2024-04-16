const regex = /^[(£](?:\d+|\d{1,3}(?:,\d{3})*)(?:[.]\d+)?[)]$|^[+-]?(?:\d+|\d{1,3}(?:,\d{3})*)(?:[.]\d+)?$/; // regex to match currency values, this includes negative values and values in parentheses and with commas
const graphColours = ["#36a2eb", "#ff6384", "#4bc0c0", "#ffcd56"];
/**
 * Rounds a number to the specified number of decimal places.
 *
 * @param {number} num - The number to round.
 * @param {number} places - The number of decimal places to round to.
 * @returns {number} The rounded number.
 */
function round(num, places) {
    num = parseFloat(num);
    places = (places ? parseInt(places, 10) : 0)
    if (places > 0) {
        let length = places;
        places = "1";
        for (let i = 0; i < length; i++) {
            places += "0";
            places = parseInt(places, 10);
        }
    } else {
        places = 1;
    }
    return Math.round((num + Number.EPSILON) * (1 * places)) / (1 * places)
}
/**
 * Removes the ending zeros from an array.
 *
 * @param {Array} array - The input array.
 * @returns {Array} - The modified array with ending zeros removed.
 */
function chopEndingZeros(array) {
    let index = array.length - 1;
    while (index >= 0 && array[index] === 0) index--;
    return array.slice(0, index + 1);
}
/**
 * Finds the key with the highest value in an array of objects.
 * @param {Array} array - The array of objects to search.
 * @returns {string} - The key with the highest value.
 */
function findHighestValue(array) {
    return array.reduce((highest, current) => {
        const key = Object.keys(current)[0];
        const value = current[key];
        return value > highest.value ? { key, value } : highest;
    }, { key: "", value: -Infinity }).key;
}
/**
 * Parses a string representation of a number and returns the parsed number.
 * 
 * @param {string} text - The string representation of the number.
 * @returns {number} The parsed number.
 */
function parseNum(text) {
    if (!text.length) return 0;
    if (text.startsWith("(") && text.endsWith(")")) return -parseFloat(text.replaceAll(",", "").replaceAll("£", "").slice(1, text.length - 1));
    else return parseFloat(text.replaceAll(",", "").replaceAll("£", ""));
}

// ---------------------------- UTILS ----------------------------
let data = {};
let projectColours = {};

/**
 * Removes a row from the table and updates the remaining rows.
 * @param {HTMLElement} element - The element representing the row to be removed.
 */
function removeRow(element) {
    const rowNumber = parseInt(element.getAttribute("data-rownum"), 10);
    const tableUUID = element.getAttribute("data-tableuuid");
    const table = document.querySelector(`table thead tr th button[data-tableuuid="${tableUUID}"]`).parentElement.parentElement.parentElement.parentElement; // get the parent table
    const rows = table.querySelectorAll("tbody tr");

    // remove the clicked row
    table.querySelector("tbody").removeChild(rows[1 + rowNumber]);

    // update the rows after the removed row
    const rowsAfter = table.querySelectorAll("tbody tr");
    for (let i = 0; i < rowsAfter.length; i++) {
        rowsAfter[i].querySelectorAll("td").forEach((td, j) => {
            if (!j) return;
            td.className = td.className.replace(/lightPink|darkPink/g, i % 2 === 0 ? "darkPink" : "lightPink"); // update the row colours to alternate
        })
        if (i === 0 || i === rowsAfter.length - 1) continue; // skip the first and last rows as they are not part of the data
        rowsAfter[i].querySelector("td").innerText = `${i - 1}`; // update the row numbers
        rowsAfter[i].querySelector("td").setAttribute("data-rownum", `${i - 1}`); // update the row numbers
    }
    updateValues(); // update the NPV values
};

/**
 * Adds a new row to the table.
 * 
 * @param {HTMLElement} element - The element that triggered the function.
 */
function AddRow(element) {
    const tableUUID = element.getAttribute("data-tableuuid");
    const length = document.querySelectorAll(`table[data-tableuuid="${tableUUID}"] tbody tr`).length - 2;

    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td class="orange bold clickable" onclick="removeRow(this)" data-rownum="${length}" data-tableuuid="${tableUUID}">${length}</td>
        <td class="${length % 2 === 0 ? "lightPink" : "darkPink"}" contenteditable="true"></td>
        <td class="${length % 2 === 0 ? "lightPink" : "darkPink"}" contenteditable="true"></td>
        <td class="${length % 2 === 0 ? "lightPink" : "darkPink"}"></td>
        <td class="${length % 2 === 0 ? "lightPink" : "darkPink"}" contenteditable="true"></td>
        <td class="${length % 2 === 0 ? "lightPink" : "darkPink"}"></td>` // create the new row

    document.querySelector(`table[data-tableuuid="${tableUUID}"] tbody`).insertBefore(tr, document.querySelector(`table[data-tableuuid="${tableUUID}"] tbody tr:last-child`))
    document.querySelectorAll(`table[data-tableuuid="${tableUUID}"] tbody tr:last-child td`).forEach((td, i) => {
        if (!i) return;
        td.className = length % 2 === 0 ? "darkPink" : "lightPink" // update the row colours to alternate
    });

    document.querySelectorAll(`table[data-tableuuid="${tableUUID}"] tbody tr:nth-last-child(2) td`).forEach((td) => {
        td.addEventListener("blur", (e) => {
            if (!regex.test(e.target.innerText.replace("£", ""))) return e.target.innerText = ""; // if the input is not a valid currency value, clear the input
            updateValues(); // update the NPV values
        });
    });
    updateValues(); // update the NPV values
};

/**
 * Deletes the table associated with the given data element and updates the values.
 * @param {HTMLElement} data - The data element associated with the table to be deleted.
 */
function deleteTable(data) {
    const uuid = data.getAttribute("data-tableuuid");
    document.querySelector(`table[data-tableuuid="${uuid}"]`).remove();
    updateValues();
};

// ---------------------------- MAIN ----------------------------
document.addEventListener("DOMContentLoaded", () => {
    // Create the background animation
    VANTA.WAVES({
        el: ".background-container",
        touchControls: true,
        color: 0x17171e,
        shininess: 43.0,
        waveHeight: 8.5,
        waveSpeed: 2.0,
        zoom: 0.65,
    });
    const addTableBtn = document.getElementById("addTableBtn");
    const tablesContainer = document.getElementById("tablesContainer");

    // Add event listener to the add table button
    addTableBtn.addEventListener("click", () => {
        const newTable = document.createElement("table"); // create a new table
        const tableUUID = crypto.randomUUID(); // generate a unique ID for the table
        newTable.setAttribute("data-tableuuid", tableUUID);

        // add the table to the tables container
        newTable.innerHTML = `
            <thead class="orange">
                <tr>
                    <th colspan="6" contenteditable="true">Project ${document.querySelectorAll("table").length + 1}<button contenteditable="false" class="close-button" onclick="deleteTable(this)" data-tableuuid="${tableUUID}"></button></th>
                </tr>
            </thead>
            <div id="break">
            <tbody>
                <tr>
                    <td class="orange bold">Year</td>
                    <td class="darkPink bold">Cash In</td>
                    <td class="darkPink bold">Cash Out</td>
                    <td class="darkPink bold">Net Cash Flow (£)</td>
                    <td class="darkPink bold">Discount Factor</td>
                    <td class="darkPink bold">Present Value</td>
                </tr>
                <tr>
                    <td class="orange bold clickable" onclick="removeRow(this)" data-rownum="0" data-tableuuid="${tableUUID}">0</td>
                    <td class="lightPink" contenteditable="true"></td>
                    <td class="lightPink" contenteditable="true"></td>
                    <td class="lightPink"></td>
                    <td class="lightPink" contenteditable="true"></td>
                    <td class="lightPink"></td>
                </tr>
                <tr>
                    <td class="orange bold clickable" onclick="removeRow(this)" data-rownum="1" data-tableuuid="${tableUUID}">1</td>
                    <td class="darkPink" contenteditable="true"></td>
                    <td class="darkPink" contenteditable="true"></td>
                    <td class="darkPink"></td>
                    <td class="darkPink" contenteditable="true"></td>
                    <td class="darkPink"></td>
                </tr>
                <tr>
                    <td class="orange bold clickable" onclick="removeRow(this)" data-rownum="2" data-tableuuid="${tableUUID}">2</td>
                    <td class="lightPink" contenteditable="true"></td>
                    <td class="lightPink" contenteditable="true"></td>
                    <td class="lightPink"></td>
                    <td class="lightPink" contenteditable="true"></td>
                    <td class="lightPink"></td>
                </tr>
                <tr>
                    <td class="orange bold clickable" onclick="removeRow(this)" data-rownum="3" data-tableuuid="${tableUUID}">3</td>
                    <td class="darkPink" contenteditable="true"></td>
                    <td class="darkPink" contenteditable="true"></td>
                    <td class="darkPink"></td>
                    <td class="darkPink" contenteditable="true"></td>
                    <td class="darkPink"></td>
                </tr>
                <tr>
                    <td class="orange bold clickable" onclick="AddRow(this)" data-tableuuid="${tableUUID}">+</td>
                    <td class="lightPink"></td>
                    <td class="lightPink"></td>
                    <td class="lightPink"></td>
                    <td class="lightPink"><b>NPV =</b></td>
                    <td class="lightPink"></td>
                </tr>
            </tbody>
        `;
        tablesContainer.appendChild(newTable); // add the table to the tables container
        document.querySelectorAll("tbody tr td[contenteditable=true]").forEach((td) => td.addEventListener("blur", (e) => {
            if (!regex.test(e.target.innerText.replace("£", ""))) return e.target.innerText = ""; // if the input is not a valid currency value, clear the input
            updateValues(); // update the NPV values
        }));
        document.querySelectorAll("thead tr th[contenteditable=true]").forEach((th) => th.addEventListener("blur", () => {
            updateValues(); // update the NPV values
        }));
        updateValues(); // update the NPV values
    });
});

/**
 * Updates the values in the NPV calculator.
 */
function updateValues() {
    data = {};
    const tables = document.querySelectorAll("table");
    let npvValues = [];
    tables.forEach((table) => {
        const rows = table.querySelectorAll("tbody tr");
        const projectTitle = table.querySelector("thead tr th").innerText;
        const cashFlows = []; // net cash flows
        const discountFactors = []; // discount factors
        const presentValues = []; // present values
        let npv = 0; // net present value
        let i = 0; // year counter
        rows.forEach((row) => {
            if (i === 0) return i++; // skip the first row
            if (!data[projectTitle]) data[projectTitle] = []; // create a new array for the project if it does not exist

            const cells = row.querySelectorAll("td");
            const cashIn = isNaN(parseNum(cells[1].innerText)) ? 0 : parseNum(cells[1].innerText); // parse the cash in value
            const cashOut = isNaN(parseNum(cells[2].innerText)) ? 0 : parseNum(cells[2].innerText); // parse the cash out value
            const discountFactor = isNaN(parseNum(cells[4].innerText)) ? 1 : parseNum(cells[4].innerText); // parse the discount factor
            const presentValue = discountFactor * (cashIn - cashOut); // calculate the present value

            if (cells[1].innerText.length && cells[2].innerText.length) cells[3].innerText = cashIn - cashOut; // update the net cash flow
            if (cells[1].innerText.length && cells[2].innerText.length && cells[4].innerText.length) cells[5].innerText = presentValue; // update the present value

            if (i > 0 && cashIn.toString().length && cashOut.toString().length && discountFactor.toString().length) {
                const netCashFlow = cashIn - cashOut; // calculate the net cash flow
                cashFlows.push(netCashFlow); // add the net cash flow to the array
                discountFactors.push(discountFactor); // add the discount factor to the array
                presentValues.push(netCashFlow / discountFactor); // add the present value to the array
                npv += netCashFlow * discountFactor; // calculate the net present value
                data[projectTitle].push({ year: i, presentValue }); // add the present value to the project data
            }
            i++; // increment the year counter

            cells.forEach((cell, j) => {
                if (!cell.contentEditable || !cell.innerText.length || j < 1 || cell.innerText.includes("NPV =") || j == 4) return; // skip the first cell, cells that are not contenteditable, empty cells, and the NPV cell
                if (parseNum(cell.innerText) < 0) cell.innerText = "(£" + Math.abs(parseNum(cell.innerText)).toLocaleString() + ")"; // format negative values
                else cell.innerText = "£" + round(parseNum(cell.innerText), 2).toLocaleString(); // format positive values
            })
        });
        if (npv) {
            if (npv < 0) rows[rows.length - 1].querySelectorAll("td")[5].innerText = "(£" + Math.abs(round(npv, 2)).toLocaleString() + ")"; // format negative values
            else rows[rows.length - 1].querySelectorAll("td")[5].innerText = "£" + round(npv, 2).toLocaleString(); // format positive values
            npvValues.push({ [projectTitle]: npv }); // add the NPV to the array
        } else {
            rows[rows.length - 1].querySelectorAll("td")[5].innerText = ""; // clear the NPV cell
            document.getElementById("winning-project").hidden = true; // hide the winning project
        }
    });
    if (!tables.length) { // if there are no tables, clear the NPV values and hide the winning project
        document.getElementById("winning-project").hidden = true;
        document.getElementById("myChart").remove();
    } else updateChart();

    if (npvValues.length) { // if there are NPV values, find the highest NPV and display the winning project
        const highestNPVTitle = findHighestValue(npvValues);
        document.getElementById("winning-project").innerText = `Winning Project:\n${highestNPVTitle}`;
        document.getElementById("winning-project").hidden = false;
    }
}

/**
 * Updates the chart with the latest data.
 */
function updateChart() {
    if (document.getElementById("myChart")) document.getElementById("myChart").remove(); // remove the old chart
    const ctx = document.createElement("canvas"); // create a new canvas element
    ctx.id = "myChart"; // set the canvas ID
    document.querySelector(".chart-wrapper").insertBefore(ctx, document.querySelector("#winning-project")); // add the canvas to the chart wrapper

    // create the new chart
    new Chart(ctx, {
        type: "line",
        data: {
            labels: Array.from({ length: Math.max(...Object.values(data).map((v) => v.length)) - 1 }, (_, i) => `Year ${i}`), // X-axis labels based on the number of years
            datasets: [
                {
                    label: "", // X-axis drawn as it is not an option in Chart.js
                    data: Array.from({ length: Math.max(...Object.values(data).map((v) => v.length)) }, (_) => 0), // Y-axis drawn as it is not an option in Chart.js
                    borderWidth: 2,
                    pointStyle: false,
                    borderColor: "#000000",
                },
                ...Object.entries(data).filter(([k, v]) => v).map(([key, value], i) => ({ // create a dataset for each project
                    label: key,
                    data: chopEndingZeros(value.map((v) => v.presentValue)).reduce((acc, val, i, arr) => { // remove ending zeros from the present values
                        arr[i - 1] !== undefined ? acc.push(acc[i - 1] + val) : acc.push(val); // calculate the cumulative NPV
                        return acc;
                    }, []), // Cumulative NPV
                    borderWidth: 2,
                    borderColor: graphColours[i % graphColours.length], // set the graph colour and cycle through the colours
                }))
            ],
            tension: 0.1
        },
        options: { // extra options for the chart
            scales: {
                y: {
                    title: {
                        display: true,
                        text: "Cumulative Project Net Present Value (NPV) (£)",
                        font: {
                            size: 18,
                        },
                        padding: {
                            bottom: 10,
                            top: 10,
                        }
                    },
                },
                x: {
                    title: {
                        display: true,
                        text: "Year Since Project Start",
                        font: {
                            size: 18,
                        },
                        padding: {
                            bottom: 10,
                            top: 10,
                        }
                    },
                    beginAtZero: true
                },
            },
            plugins: {
                title: {
                    display: true,
                    text: "Cumulative Project Net Present Value (NPV) Over Time",
                    font: { size: 24 },
                },
            },
        },
    });
}