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
                }
                const buttonClass = event.target.getAttribute("class");
                console.log(buttonClass);

                if (buttonClass === 'add_button') {
                    event.target.innerHTML = "додаю...";
                    DataTable(config, data, true);
                }
                if (buttonClass === 'save_button') {
                    console.log("trying to add....");
                    console.log(event.target.closest('tr'));
                    let isDataSaved = addElement(event.target.closest('tr'));
                    if (isDataSaved) {
                        console.log("all data is saved.");
                        DataTable(config, data);
                    }
                }
            }
        });
        table.addEventListener('keydown', (event) => {
            const eventKey = event.key;
            if (eventKey === 'Enter') {
                console.log("YRAA! ENTER IS PRESSED!");
                console.log(event.target.closest('tr'));
                let isDataSaved = addElement(event.target.closest('tr'));
                if (isDataSaved) {
                    console.log("all data is saved.");
                    DataTable(config, data);
                }
            }
        });

        container.append(table);
    }
}

function getHTMLRow(attributes) {
    let attributesKeys = Object.keys(attributes);
    let row = "";
    if (attributes.type === 'select') {
        row = '<select ';
        row += attributesKeys.map((key) => {
            if (key !== 'options' && key !== 'type' && key !== 'label') {
                if (key === 'required' && !attributes[key]) {
                    return "";
                } else {
                    return `${key}='${attributes[key]}'`;
                }
            }
        }).join(" ");
        row += '>';
        row += attributes.options.map((option) => {
            return `<option value='${option}'>${option}</option>`;
        }).join("");
        row += '</select>';
    } else {
        row = '<input ';
        row += attributesKeys.map((key) => {
            if (key !== 'label') {
                  if (key === 'required' && !attributes[key]) {
                    return "";
                } else {
                    return `${key}='${attributes[key]}'`;
                }
            }
        }).join(" ");
        row += '>';
    }
    return row + `<span> (${attributes.label})</span>`;
}


function buildElement(input, entrie) {
    const defaultAttributes = {
        type: 'text',
        name: entrie.value,
        label: entrie.title,
        required: true
    };
    let elemAttributes = { ...defaultAttributes, ...input };

    return getHTMLRow(elemAttributes);
}

function renderInput(config) {
    let inputRow = config.columns.map((entrie) => {
        if (Array.isArray(entrie.input)) {
            let cell = entrie.input.map((inputElement) => {
                return buildElement(inputElement, entrie);
            }).join("");
            return addTags(TABLE_DATA, cell);
        }
        return addTags(TABLE_DATA, buildElement(entrie.input, entrie));
    }).join("");
    inputRow += addTags(TABLE_DATA, `<button class="save_button">Зберегти</button>`);
    // console.log("trying to add with className(input)", inputRow);
    return addTags(TABLE_ROW, inputRow, 'input');
}

function createTableBody(config, data, newRow) {
    let fields = config.columns.map((dataField) => dataField.value);
    let bodyRows = "";
    if (newRow) {
        bodyRows = renderInput(config);
    }
    // console.log("row before add...");
    // console.log(bodyRows);
    bodyRows += data.map(([dataKey, elem]) => {
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
    // console.log("after body");
    // console.log(bodyRows);
    // console.log("===============================================");
    return addTags(TABLE_BODY, bodyRows);
}

function createTableHead(config) {
    let headerRow = config.columns.map((header) =>
        addTags(TABLE_HEADER_DATA, header.title)).join("");
    const addRowButton = addTags(TABLE_HEADER_DATA, `<button class="add_button">Додати дані</button>`);
    headerRow += addRowButton;
    return addTags(TABLE_HEAD, addTags(TABLE_ROW, headerRow));
}

function addElement(inputRow) {
    // TODO: зробити якусь фігню тут. 

    
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

function addTags(tag, data, className) {
    if (className) {
        return `<${tag} class="${className}">${data}</${tag}>`
    }
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
        {
            title: 'Ім’я',
            value: 'name',
            input: { type: 'text' }
        },
        {
            title: 'Прізвище',
            value: 'surname',
            input: { type: 'text' }
        },
        {
            title: 'Вік',
            value: (user) => getAge(user.birthday),
            input: {
                type: 'date',
                name: 'birthday',
                label: 'Дата народження',
                max: '2026-02-16',
                min: '1900-01-01'
            }
        },
        {
            title: 'Фото',
            value: (user) => `<img src="${user.avatar}" alt="${user.name} ${user.surname}"/>`,
            input:
            {
                type: 'url',
                name: 'avatar',
                placeholder: 'https://images.com/photo.jpg',
                required: false
            }
        }
    ],
    apiUrl: "https://mock-api.shpp.me/akoskovtsev/users"
};

DataTable(config1);
const config2 = {
    parent: '#productsTable',
    columns: [
        {
            title: 'Назва',
            value: 'title',
            input: { type: 'text' }
        },
        {
            title: 'Ціна',
            value: (product) => `${product.price} ${product.currency}`,
            input: [
                { type: 'number', name: 'price', label: "Ціна" },
                { type: 'select', name: 'currency', label: 'Валюта', options: ['$', '€', '₴'], required: false }
            ]
        },
        {
            title: 'Колір',
            value: (product) => getColorLabel(product.color),
            input: { type: 'color', name: 'color' }
        },
    ],
    apiUrl: "https://mock-api.shpp.me/akoskovtsev/products"
};

DataTable(config2);