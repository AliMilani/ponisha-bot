import https from "https"; // or 'httpss' for httpss:// URLs
import fs from "fs";
export const downloadFile = (url, dest) =>
  new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const request = https.get(url, function (response) {
      response.pipe(file);

      // after download completed close filestream
      file.on("finish", () => {
        file.close();
        resolve();
      });

        // if error occurs during download
        file.on("error", (err) => {
          fs.unlink(dest);
          reject(err);
        });
    });
  });
