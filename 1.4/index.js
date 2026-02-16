"use strict";

const TABLE = "table";
const TABLE_HEAD = "thead";
const TABLE_BODY = "tbody";
const TABLE_HEADER_DATA = "th";
const TABLE_ROW = "tr";
const TABLE_DATA = "td";

async function DataTable(config, data, newRow) {
    if (!data) {
        let getData = await fetch(config.apiUrl).catch((error) => {
            console.log("some error: " + error);
            return error;
        });
        let dataObjects = await getData.json();
        data = Object.entries(dataObjects.data);
    }
    data.sort((a, b) => b[0] - a[0]);
    const thead = createTableHead(config);

    const tbody = createTableBody(config, data, newRow);
    const DOMadress = config.parent;
    const container = document.querySelector(config.parent);
    let table = container.querySelector('table');
    if (table) {
        table.innerHTML = thead + tbody;
    } else {
        table = document.createElement('table');
        table.className = DOMadress.slice(1);
        table.innerHTML = thead + tbody;
        table.addEventListener('click', (event) => {
            if (event.target.localName === 'button') {
                const targetTable = event.currentTarget.getAttribute("class");
                const buttonID = event.target.dataset.id;
                if (buttonID) {
                    deleteElement(buttonID, targetTable, config);
                    event.target.disabled = true;
                    event.target.innerHTML = "видаляю...";
                } else {
                    event.target.innerHTML = "додаю...";
                    DataTable(config, data, true);
                }
            }
        });
        container.append(table);
    }
}

function renderInput(config){

    let inputRow = config.columns.map((key) => {
            if(key.value !== 'string'){
                let inputName = key.value...
                return addTags(TABLE_DATA, `<input name=${inputName}><br>(${inputName})`)             
            }
            return addTags(TABLE_DATA, `<input name=${key.value}><br>(${key.value})`);
        }).join("");
        inputRow += addTags(TABLE_DATA, `<button class="save-btn">Зберегти</button>`);
    return addTags(TABLE_ROW, inputRow);
}

function createTableBody(config, data, newRow) {
    let fields = config.columns.map((dataField) => dataField.value);
    let bodyRows = "";
    if (newRow) {
        bodyRows = renderInput(config);
    }
    bodyRows += data.map(([dataKey, elem]) => {
        // elemNumber.push(dataKey);
        let row = fields.map((key) => {
            if (typeof key !== 'string') {
                let dataValue = key(elem);
                if (typeof dataValue === 'string' && dataValue.includes('cloudflare')) {
                    dataValue = dataValue.replace('cloudflare-ipfs.com', 'ipfs.io');
                }
                return addTags(TABLE_DATA, dataValue);
            } else {
                return addTags(TABLE_DATA, elem[key]);
            }
        }).join("");
        row += addTags(TABLE_DATA, `<button data-id=${dataKey} class="delete_button">Видалити дані</button>`);
        return addTags(TABLE_ROW, row);
    }).join("");
    // console.log(elemNumber);
    return addTags(TABLE_BODY, bodyRows);
}

function createTableHead(config) {
    let headerRow = config.columns.map((header) =>
        addTags(TABLE_HEADER_DATA, header.title)).join("");
    const addRowButton = addTags(TABLE_HEADER_DATA, `<button class="add_button">Додати дані</button>`);
    headerRow += addRowButton;
    return addTags(TABLE_HEAD, addTags(TABLE_ROW, headerRow));
}

function addElement() {

}

function deleteElement(id, table, config) {
    console.log("clicked button #", id);
    console.log("from table: ", table);
    fetch(config.apiUrl + `/${id}`, {
        method: "DELETE"
    }).then(res => {
        if (res.ok) {
            console.log("all data deleted, now is ok");
            DataTable(config);
        }
    })
}

function addTags(tag, data) {
    return `<${tag}>${data}</${tag}>`;
}

function getAge(birthday) {
    const dateOfBirth = new Date(birthday);
    const today = new Date();
    let date = today.getFullYear() - dateOfBirth.getFullYear();
    return date;
}

function getColorLabel(color) {
    return `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 4px;"></div>`;
}

const config1 = {
    parent: '#usersTable',
    columns: [
        { title: 'Ім’я', value: 'name' },
        { title: 'Прізвище', value: 'surname' },
        { title: 'Вік', value: (user) => getAge(user.birthday) },
        { title: 'Фото', value: (user) => `<img src="${user.avatar}" alt="${user.name} ${user.surname}"/>` }
    ],
    apiUrl: "https://mock-api.shpp.me/akoskovtsev/users"
};

DataTable(config1);
const config2 = {
    parent: '#productsTable',
    columns: [
        { title: 'Назва', value: 'title' },
        { title: 'Ціна', value: (product) => `${product.price} ${product.currency}` },
        { title: 'Колір', value: (product) => getColorLabel(product.color) },
    ],
    apiUrl: "https://mock-api.shpp.me/akoskovtsev/products"
};

DataTable(config2);