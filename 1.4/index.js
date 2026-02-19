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
                    if (dataToSave) {
                        let isDataSaved = await changeData(dataToSave, urlToChange);
                        if (isDataSaved) {
                            DataTable(config);
                        }
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
                    if (dataToSave) {
                        let isDataSaved = await sendData(dataToSave, config.apiUrl);
                        if (isDataSaved) {
                            DataTable(config);
                        }
                    }
                }
            }
        });
        table.addEventListener('keydown', async (event) => {
            const eventKey = event.key;
            if (eventKey === 'Enter') {
                let dataToSave = getDataToSave(event.target.closest('tr'));
                if (dataToSave) {
                    let isDataSaved = await sendData(dataToSave, config.apiUrl);
                    if (isDataSaved) {
                        DataTable(config);
                    }
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
    if (typeof config.value === 'string') {
        return data[config.value];
    }
    if (specInput.type === 'date') {
        return data[specInput.name].slice(0, 10);
    }
    return data[specInput.name];
}

function buildElement(input, entrie, data) {
    const defaultAttributes = {
        type: 'text',
        name: entrie.value,
        label: entrie.title,
        placeholder: entrie.title,
        required: true,
    };
    let elemAttributes = { ...defaultAttributes, ...input };
    if (!data) {
        return getHTMLRow(elemAttributes);
    }
    let valueAttribute = data[input.name || entrie.value];
    valueAttribute = (input.type === 'date' && valueAttribute) ? valueAttribute.slice(0, 10) : valueAttribute;
    return getHTMLRow({ ...elemAttributes, ...{ value: valueAttribute } });
}

function renderInput(config, data, id) {
    let cells = config.columns.map((entrie) => {
        const inputs = Array.isArray(entrie.input) ? entrie.input : [entrie.input];
        const cell = inputs.map((inputElement) => buildElement(inputElement, entrie, data)).join("");
        return addTags(TABLE_DATA, cell);
    });
    const mode = data ? 'saveChanges' : 'addNewData';
    cells.push(renderButtons(id, mode));
    const content = cells.join("");
    return data ? content : addTags(TABLE_ROW, content);
}

function checkImages(data) {
    return typeof data === 'string' && data.includes('cloudflare') ? data.replace('cloudflare-ipfs.com', 'ipfs.io') : data;
}

function renderButtons(id, action) {
    const modes = {
        standartButtons: () => addTags(TABLE_DATA, `<button data-id=${id} class="delete_button">Видалити дані</button>`) +
            addTags(TABLE_DATA, `<button data-id=${id} class="change_button">Редагувати</button>`),
        saveChanges: () => addTags(TABLE_DATA, `<button data-id=${id} class="delete_button">Видалити дані</button>`) +
            addTags(TABLE_DATA, `<button data-id=${id} class="save_changes_button">Зберегти</button>`),
        addNewData: () => addTags(TABLE_DATA, `<button data-id=${id} class="cancel_button">Скасувати</button>`) +
            addTags(TABLE_DATA, `<button class="save_button">Зберегти</button>`)
    }
    return modes[action]();
}

function createTableBody(config, data, newRow) {
    let bodyRows = newRow ? renderInput(config) : "";
    bodyRows += data.map(([dataKey, elem]) => {
        const cells = config.columns.map(dataField => {
            let key = dataField.value;
            if (typeof key === 'string') {
                return addTags(TABLE_DATA, elem[key], key, elem[key]);
            }
            const inputs = Array.isArray(dataField.input) ? dataField.input : [dataField.input];
            const nameAttribute = inputs.map(entrie => entrie.name).join(" ");
            const valueAttribute = inputs.map(entrie => elem[entrie.name]).join(" ");
            const functionValue = checkImages(key(elem));
            return addTags(TABLE_DATA, functionValue, nameAttribute, valueAttribute);
        });
        cells.push(renderButtons(dataKey, 'standartButtons'));
        return addTags(TABLE_ROW, cells.join(""));
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
    let isValid = true;
    inputs.forEach(input => {
        if (!input.checkValidity()) {
            input.style.outline = "2px solid red";
            isValid = false;
        } else {
            input.style.outline = "";
        }
    });
    const data = [...inputs].reduce((acc, input) => {
        acc[input.name] = input.type === 'number' ? +input.value : input.value;
        return acc;
    }, {});
    if (isValid) {
        return data;
    }
}

function getDataFromRow(row) {
    const rowData = Array.from(row.querySelectorAll('td'));
    return rowData.reduce((data, cell) => {
        const { cellid, value } = cell.dataset;
        if (cellid) {
            const names = cellid.split(" ");
            const values = value.split(" ");
            names.forEach((entrie, index) => {
                data[entrie] = values[index] ?? "";
            });
        }
        return data;
    }, {});
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