const fs = require("fs/promises");
const path = require("path");

try {
    var data: any = require('../../data/state.json');
} catch (exc) {
    var data: any = {};
}

const save = async () => await fs.writeFile(path.resolve(__dirname, "../../data/state.json"), JSON.stringify(data));

export function $get (key: string) {
    return data[key];
}

export async function $set (key: string, value: any) {
    data[key] = value;
    await save();
}

export async function $del (key: string) {
    delete data[key];
    await save();
}