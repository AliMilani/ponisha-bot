import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

export const getDirName = (importMetaUrl) => dirname(fileURLToPath(importMetaUrl))

export const getFilePath = (importMetaUrl, fileName) => join(getDirName(importMetaUrl), fileName)