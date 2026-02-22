"use strict";

const TABLE = "table";
const TABLE_HEAD = "thead";
const TABLE_BODY = "tbody";
const TABLE_HEADER_DATA = "th";
const TABLE_ROW = "tr";
const TABLE_DATA = "td";

async function DataTable(config, data, newRow) {
    data ??= await loadData(config);
    data.sort((a, b) => b[0] - a[0]);
    const container = document.querySelector(config.parent);
    let table = container.querySelector('table') || initTable(container, config, data);
    table.innerHTML = createTableHead(config) + createTableBody(config, data, newRow);
}

function initTable(container, config, data) {
    const table = document.createElement('table');
    table.className = config.parent.slice(1);
    table.addEventListener('click', event => handleTableAction(event, config, data));
    table.addEventListener('keydown', async event => handleTableAction(event, config, data));
    container.append(table);
    return table;
}

async function loadData(config) {
    try {
        const response = await fetch(config.apiUrl);
        const dataObjects = await response.json();
        return Object.entries(dataObjects.data);
    } catch (error) {
        console.error("Load error", error);
        return [];
    }
}

async function handleTableAction(event, config, data) {
    const target = event.target;
    const row = target.closest('tr');
    const url = config.apiUrl;
    const buttonId = target.dataset.id;
    if (target.localName === 'button') {
        const action = target.getAttribute("class");
        const buttons = {
            add_button: () => DataTable(config, data, true /* inputRow */),
            edit_button: () => row.innerHTML = renderInput(config, getDataFromRow(row), buttonId),
            cancel_button: () => DataTable(config),
            delete_button: () => {
                deleteElement(buttonId, config);
                target.disabled = true;
                target.innerHTML = "видаляю...";
            },
            update_button: async () => {
                const urlToChange = url + '/' + buttonId;
                const dataToSave = getDataToSave(row);
                dataToSave && await changeData(dataToSave, urlToChange) && DataTable(config);
            },
            save_button: async () => {
                const dataToSave = getDataToSave(row);
                dataToSave && await sendData(dataToSave, url) && DataTable(config);
            }
        }
        buttons[action]?.();
    }
    if (event.key === 'Enter') {
        const dataToSave = getDataToSave(row);
        dataToSave && await sendData(dataToSave, url) && DataTable(config)
    }
}

function getHTMLRow(config) {
    const { options, type = 'text', label, ...attributes } = config;
    let attributesKeys = Object.entries(attributes).map(([key, value]) => value !== false ? `${key}='${value}'` : "").join(" ");
    if (type !== 'select') {
        return `<input type='${type}' ${attributesKeys}>`;
    }
    const optionsHtml = options?.map(option =>
        `<option value='${option}' ${option === config.value ? 'selected' : ''}>${option}</option>`
    ).join("");
    return `<select ${attributesKeys}>${optionsHtml}</select>`;
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
    const mode = data ? 'updateChanges' : 'addNewData';
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
            addTags(TABLE_DATA, `<button data-id=${id} class="edit_button">Редагувати</button>`),
        updateChanges: () => addTags(TABLE_DATA, `<button data-id=${id} class="delete_button">Видалити дані</button>`) +
            addTags(TABLE_DATA, `<button data-id=${id} class="update_button">Змінити</button>`),
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
    const addRowButton = `<th colspan="2"><button class="add_button">Додати дані</button></th>`;
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
        if (!input.reportValidity()) {
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
    return `<div style="background-color: ${color}; width: 80px; height: 40px; border-radius: 4px;"></div>`;
}

const config1 = {
    parent: '#usersTable',
    columns: [
        {
            title: 'Ім’я',
            value: 'name',
            input: {
                type: 'text',
                pattern: '^[A-Za-zА-Яа-яЁёІіЇїЄє]+$',
                minlength: '2',
                title: 'Будь ласка, використовуйте лише літери (без цифр та пробілів)'
            }
        },
        {
            title: 'Прізвище',
            value: 'surname',
            input: {
                type: 'text',
                pattern: '^[A-Za-zА-Яа-яЁёІіЇїЄє]+$',
                minlength: '2',
                title: 'Будь ласка, використовуйте лише літери (без цифр та пробілів)'
            }
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
            value: (user) => {
                const defaultImg = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                return `<img src="${user.avatar}" onerror="this.src='${defaultImg}'" alt="${user.name} ${user.surname}"/>`;
            },
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
            input: {
                type: 'text',
                pattern: '^(?!\\s*$).+',
                minlength: '2',
                title: 'Будь ласка, використовуйте лише літери (без цифр та пробілів)'
            }
        },
        {
            title: 'Ціна',
            value: (product) => `${product.price} ${product.currency}`,
            input: [
                { type: 'number', name: 'price', label: "Ціна", min: '0', step: '0.1' },
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