"use strict";

const TABLE = "table";
const TABLE_HEAD = "thead";
const TABLE_BODY = "tbody";
const TABLE_HEADER_DATA = "th";
const TABLE_ROW = "tr";
const TABLE_DATA = "td";



//define some sample data
// var tabledata = [
//     { id: 1, name: "Oli Bob", age: "12", col: "red", dob: "" },
//     { id: 2, name: "Mary May", age: "1", col: "blue", dob: "14/05/1982" },
//     { id: 3, name: "Christine Lobowski", age: "42", col: "green", dob: "22/05/1982" },
//     { id: 4, name: "Brendon Philips", age: "125", col: "orange", dob: "01/08/1980" },
//     { id: 5, name: "Margret Marmajuke", age: "16", col: "yellow", dob: "31/01/1999" },
// ];
//create Tabulator on DOM element with id "example-table"


// document.addEventListener("DOMContentLoaded", function () {
//     // Весь ваш код Tabulator має бути тут
//     var table = new Tabulator("#example-table", {
//         height: 205,
//         data: users, // переконайтеся, що users теж визначені!
//         layout: "fitColumns",
//         columns: config1.columns, // переконайтеся, що config1 визначений!
//         rowClick: function (e, row) {
//             alert("Row " + row.getData().id + " Clicked!!!!");
//         },
//     });
// });
// var table = new Tabulator("#example-table", {
//     height: 205, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
//     data: users, //assign data to table
//     layout: "fitColumns", //fit columns to width of table (optional)
//     // columns: [ //Define Table Columns
//     //     { title: "Name", field: "name", width: 150 },
//     //     { title: "Age", field: "age", hozAlign: "left", formatter: "progress" },
//     //     { title: "Favourite Color", field: "col" },
//     //     { title: "Date Of Birth", field: "dob", sorter: "date", hozAlign: "center" },
//     // ],
//     columns: config1.columns,
//     rowClick: function (e, row) { //trigger an alert message when the row is clicked
//         alert("Row " + row.getData().id + " Clicked!!!!");
//     },
// });

function DataTable(config, data) {
    // console.log("name: " + data[0].name);
    // console.log("title: " + config.columns[0].title);
    let myTableHead = config.columns.reduce((result, elem) => result += addTags(TABLE_HEADER_DATA, elem.title), "");
    myTableHead = addTags(TABLE_ROW, myTableHead);
    myTableHead = addTags(TABLE_HEAD, myTableHead);
    let dataKeys = config.columns.map((elem) => {
        return elem.field;
    });
    // console.log(dataKeys);
    let myTableBody = users.reduce((result, elem) => {
        result += addTags(TABLE_ROW, (dataKeys.map((key) => addTags(TABLE_DATA, elem[key])).join("")));
        return result;
    }, "");
    myTableBody = addTags(TABLE_BODY, myTableBody);
    return addTags(TABLE, myTableHead + myTableBody);
}

function addTags(tag, data) {
    return `<${tag}>${data}</${tag}>`;
}

/****************TABLE ELEMENTS*************/
// const table = document.getElementById(config.parent.slice(1));
// const result = DataTable(config1, users);
// console.log("result of program: ", result);
// table.innerHTML = result;
/****************TABLE ELEMENTS**************/