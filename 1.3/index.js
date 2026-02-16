"use strict";

const TABLE = "table";
const TABLE_HEAD = "thead";
const TABLE_BODY = "tbody";
const TABLE_HEADER_DATA = "th";
const TABLE_ROW = "tr";
const TABLE_DATA = "td";
function DataTable(config, data) {
    const thead = addTags(TABLE_HEAD,
        addTags(TABLE_ROW,
            config.columns.map((header) =>
                addTags(TABLE_HEADER_DATA, header.title)).join("")));

    const tbody = addTags(TABLE_BODY,
        data.map((elem) =>
            addTags(TABLE_ROW,(config.columns.map((dataField) =>
                    dataField.value).map((key) => addTags(TABLE_DATA, elem[key])).join("")))).join(""));

    return addTags(TABLE, thead + tbody);
}

function addTags(tag, data) {
    return `<${tag}>${data}</${tag}>`;
}