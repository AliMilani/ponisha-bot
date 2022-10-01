import assert from "assert";
import https from "https";
import { arch, platform } from "node:process";
import { downloadFile } from "./utils/newDownload.utils.js";
import { unzip } from "./utils/zip.utils.js";
import download from "download";
import fs from 'fs'
import path from "path";

const SUPPORTED_PLATFORMS = ["linux", "mac", "mac_arm", "win32"];
const STORAGE_BASE_URL =
  "https://storage.googleapis.com/chromium-browser-snapshots";


function fetch(url) {
  let resolve;
  const promise = new Promise((x) => {
    return (resolve = x);
  });
  https
    .get(url, (response) => {
      if (response.statusCode !== 200) {
        resolve(null);
        return;
      }
      let body = "";
      response.on("data", function (chunk) {
        body += chunk;
      });
      response.on("end", function () {
        resolve(body);
      });
    })
    .on("error", function (e) {
      // This is okay; the server may just be faster at closing than us after
      // the body is fully sent.
      if (e.message.includes("ECONNRESET")) {
        return;
      }
      console.error(`Error fetching data from ${url}: ${e}`);
      resolve(null);
    });
  return promise;
}

if (!SUPPORTED_PLATFORMS.includes(platform)) {
  throw new Error(
    `Unsupported platform: ${platform}, only ${SUPPORTED_PLATFORMS.join(
      ", "
    )} are supported`
  );
}

async function getBrowserDownloadLink() {
  const lastVersion = await getBrowserLastVersion();
  switch (platform) {
    case "win32":
      return arch === "x64"
        ? `${STORAGE_BASE_URL}/Win_x64/${lastVersion}/chrome-win.zip`
        : `${STORAGE_BASE_URL}/Win/${lastVersion}/chrome-win.zip`;
      break;

    case "linux":
      return `${STORAGE_BASE_URL}/Linux_x64/${lastVersion}/chrome-linux.zip`;
      break;

    case "mac":
      return arch === "mac_arm"
        ? `${STORAGE_BASE_URL}/Mac_Arm/${lastVersion}/chrome-mac.zip`
        : `${STORAGE_BASE_URL}/Mac/${lastVersion}/chrome-mac.zip`;
      break;

    default:
      break;
  }
}

async function getBrowserLastVersion() {
  switch (platform) {
    case "win32":
      return arch === "x64"
        ? await fetch(`${STORAGE_BASE_URL}/Win_x64/LAST_CHANGE`)
        : await fetch(`${STORAGE_BASE_URL}/Win/LAST_CHANGE`);
      break;

    case "linux":
      return fetch(`${STORAGE_BASE_URL}/Linux_x64/LAST_CHANGE`);
      break;

    case "mac":
      return arch === "mac_arm"
        ? await fetch(`${STORAGE_BASE_URL}/Mac_Arm/LAST_CHANGE`)
        : await fetch(`${STORAGE_BASE_URL}/Mac/LAST_CHANGE`);
      break;

    default:
      break;
  }
}

async function downloadAndExtractBrowser(browserUrl) {
  await download(browserUrl, "./", { extract: true })
}

function renameBrowserFolder(browserUrl) {
  const browserFolderName = browserUrl.split("/").pop().split(".")[0]
  fs.renameSync(browserFolderName, 'browser')
}

(async () => {
  const browserDownloadUrl = await getBrowserDownloadLink();
  await downloadAndExtractBrowser(browserDownloadUrl);
  renameBrowserFolder(browserDownloadUrl)
})();
