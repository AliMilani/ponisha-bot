import { loadJsonFile } from 'load-json-file';
import lodashGet from 'lodash.get'

async function get(path, defaultValue) {
    const config = await loadJsonFile('config_defualt.json')
    return lodashGet(config, path, defaultValue)
}

export default {get}