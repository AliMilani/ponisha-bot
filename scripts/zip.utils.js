import extract from "extract-zip";

export const unzip  = async (zipFile, dest) => await extract(zipFile, { dir: dest });
