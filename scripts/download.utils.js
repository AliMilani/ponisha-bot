import { createWriteStream, unlink } from "fs";
import { get } from "https";
export const downloadFile = (url, dest) =>
    new Promise((resolve, reject) => {
        const file = createWriteStream(dest);
        let request = get(url, function (response) {
            response.pipe(file);
        });
        file.on("finish", () => {
            file.close();
            resolve();
        });
        file.on("error", (err) => {
            unlink(dest);
            reject(err);
        });
        request.on("error", (err) => {
            if (err.code === "ENOTFOUND" || err.code === "ETIMEDOUT") {
                reject(new Error("Unable to download the file!"));
            }
            reject(err);
        });
    });