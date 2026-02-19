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
        table.addEventListener('click', async (event) => {
            if (event.target.localName === 'button') {
                // TODO: прибрать всі іфи в (action) =>{ cancel =>{....}, change ={...}, save_changes{....}, delete{....}, add_new{....}, save_new{....}}

                const buttonClass = event.target.getAttribute("class");

                if (buttonClass === 'cancel_button') {
                    DataTable(config);
                }

                if (buttonClass === 'change_button') {
                    const row = event.target.closest('tr');
                    const rowData = getDataFromRow(row);
                    console.log("rowData: ", rowData);
                    row.innerHTML = renderInput(config, rowData, event.target.dataset.id);
                }

                if (buttonClass === 'save_changes_button') {
                    const dataID = event.target.dataset.id;
                    const urlToChange = config.apiUrl + '/' + dataID;
                    let dataToSave = getDataToSave(event.target.closest('tr'));
                    let isDataSaved = await changeData(dataToSave, urlToChange);
                    if (isDataSaved) {
                        DataTable(config);
                    }
                }

                if (buttonClass === 'delete_button') {
                    const buttonID = event.target.dataset.id;
                    deleteElement(buttonID, config);
                    event.target.disabled = true;
                    event.target.innerHTML = "видаляю...";
                }

                if (buttonClass === 'add_button') {
                    event.target.innerHTML = "додаю...";
                    event.target.disabled = true;

                    DataTable(config, data, true);
                }
                if (buttonClass === 'save_button') {
                    let dataToSave = getDataToSave(event.target.closest('tr'));
                    let isDataSaved = await sendData(dataToSave, config.apiUrl);
                    if (isDataSaved) {
                        DataTable(config);
                    }
                }
            }
        });
        table.addEventListener('keydown', async (event) => {
            const eventKey = event.key;
            if (eventKey === 'Enter') {
                let dataToSave = getDataToSave(event.target.closest('tr'));
                let isDataSaved = await sendData(dataToSave, config.apiUrl);
                if (isDataSaved) {
                    DataTable(config);
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
    return row;
}

function getValue(config, data, specInput) {
    let result = "";
    if (typeof config.value !== 'string') {
        result = data[specInput.name];
        if (specInput.type === 'date') {
            result = result.slice(0, 10);
        }
    } else {
        result = data[config.value];
    }
    return result;
}


function getKey(entrie, data){


    return ;
}

//     title: 'Ціна',
//     value: (product) => `${product.price} ${product.currency}`,
//     input: [
//             { type: 'number', name: 'price', label: "Ціна" },
//             { type: 'select', name: 'currency', label: 'Валюта', options: ['$', '€', '₴'], required: false }
//             ]


function buildElement(input, entrie, data) {
    const defaultAttributes = {
        type: 'text',
        name: entrie.value,
        label: entrie.title,
        placeholder: entrie.title,
        required: true,
    };
    let elemAttributes = { ...defaultAttributes, ...input };
    let row = "";
    // TODO: тернарний оператор щоб убрать let row
    if (data) {
        let valueAttribute = getValue(entrie, data, input);
        valueAttribute = data[getKey(entrie)]
        console.log(valueAttribute);
        row = getHTMLRow({ ...elemAttributes, ...{ value: valueAttribute } });
    } else {
        row = getHTMLRow(elemAttributes);
    }
    return row;
}

function renderInput(config, data, id) {
    let inputRow = config.columns.map((entrie) => {
        if (Array.isArray(entrie.input)) {
            let cell = entrie.input.map((inputElement) => {
                return buildElement(inputElement, entrie, data);
            }).join("");
            return addTags(TABLE_DATA, cell);
        }
        return addTags(TABLE_DATA, buildElement(entrie.input, entrie, data));
    }).join("");
    if (data) {
        inputRow += addTags(TABLE_DATA, `<button data-id=${id} class="delete_button">Видалити дані</button>`);
        inputRow += addTags(TABLE_DATA, `<button data-id=${id} class="save_changes_button">Зберегти</button>`);
        return inputRow;
    } else {
        inputRow += addTags(TABLE_DATA, `<button data-id=${id} class="cancel_button">Скасувати</button>`);
        inputRow += addTags(TABLE_DATA, `<button class="save_button">Зберегти</button>`);
    }
    return addTags(TABLE_ROW, inputRow);
}

function createTableBody(config, data, newRow) {
    let bodyRows = "";
    if (newRow) {
        bodyRows = renderInput(config);
    }
    bodyRows += data.map(([dataKey, elem]) => {
        let row = config.columns.map((dataField) => {
            let dataValueAttribute = "";
            let key = dataField.value;
            dataValueAttribute = elem[key];
            if (typeof key !== 'string') {
                let inputData = dataField.input;
                let classNameAttribute = "";
                let dataValue = key(elem);
                dataValueAttribute = dataValue;
                if (typeof dataValue === 'string' && dataValue.includes('cloudflare')) { //TODO винести окремо перевірку
                    dataValue = dataValue.replace('cloudflare-ipfs.com', 'ipfs.io');
                }
                if (Array.isArray(inputData)) {
                    classNameAttribute = inputData.map((entrie) => {
                        return entrie.name;
                    }).join(" ");
                    dataValueAttribute = inputData.map(entrie => {
                        return elem[entrie.name];
                    }).join(" ");
                } else {
                    classNameAttribute = inputData.name;
                    dataValueAttribute = elem[inputData.name];
                }
                return addTags(TABLE_DATA, dataValue, classNameAttribute, dataValueAttribute);
            } else {
                return addTags(TABLE_DATA, elem[key], key, dataValueAttribute);
            }
        }).join("");
        row += addTags(TABLE_DATA, `<button data-id=${dataKey} class="delete_button">Видалити дані</button>`);
        row += addTags(TABLE_DATA, `<button data-id=${dataKey} class="change_button">Редагувати</button>`);
        return addTags(TABLE_ROW, row);
    }).join("");
    return addTags(TABLE_BODY, bodyRows);
}

function createTableHead(config) {
    let headerRow = config.columns.map((header) =>
        addTags(TABLE_HEADER_DATA, header.title)).join("");
    const addRowButton = addTags(TABLE_HEADER_DATA, `<button class="add_button">Додати дані</button>`);
    headerRow += addRowButton;
    return addTags(TABLE_HEAD, addTags(TABLE_ROW, headerRow));
}

async function sendData(data, url) {
    const response = await fetch(url, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return response.ok;
}

async function changeData(data, url) {
    const response = await fetch(url, {
        method: "PUT",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return response.ok;
}

function deleteElement(id, config) {
    fetch(config.apiUrl + `/${id}`, {
        method: "DELETE"
    }).then(res => {
        if (res.ok) {
            DataTable(config);
        }
    })
}

function getDataToSave(inputRow) {
    const inputs = inputRow.querySelectorAll('input, select');
    const data = {};
    let isValid = true;
    inputs.forEach(input => {
        if (input.type === 'number') {
            data[input.name] = +input.value;
        } else {
            data[input.name] = input.value;
        }
        if (input.required && !input.value) {
            input.style.outline = "2px solid red";
            isValid = false;
        } else {
            input.style.outline = "";
        }
    });
    if (isValid) {
        return data;
    }
}

function getDataFromRow(row) {
    const rowData = row.querySelectorAll('td');
    const data = {};
    rowData.forEach(cell => {
        let cellEntrieName = cell.dataset.cellid;
        let cellEntrieValue = cell.dataset.value;
        if (cellEntrieName) {
            let datasetNames = cell.dataset.cellid.split(" ");
            if (Array.isArray(datasetNames) && datasetNames.length > 1) {
                let datasetValues = cell.dataset.value.split(" ");
                datasetNames.forEach((entrie, index) => {
                    data[entrie] = datasetValues[index];
                });
            } else {
                data[cellEntrieName] = cellEntrieValue;
            }
        }
    });
    return data;
}


function addTags(tag, data, className, dataValue) {
    if (!className) {
        return `<${tag}>${data}</${tag}>`;
    }
    return `<${tag} data-cellid="${className}" data-value="${dataValue}">${data}</${tag}>`;
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
                placeholder: 'https://images.com/...',
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