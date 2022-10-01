import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import config from './config.js'
import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

puppeteer.use(StealthPlugin());

const _setPuppeteerOptions = (options) => {
  const defaultOptions = {
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
    ],
    executablePath: "browser/chrome.exe",
  };
  return { ...defaultOptions, ...options };
};

const _loadBrowser = async (puppeteerOptions) => {
  return await puppeteer.launch(_setPuppeteerOptions(puppeteerOptions));
};

const _loadPage = async (browser, pageUrl, options) => {
  const page = await browser.newPage();
  await page.goto(pageUrl, options);
  return page;
};

// const _preventFreeze = async (page) => {
//   let lastpage;
//   let tryed = false;
//   let interval = setInterval(() => {
//     console.log(lastpage, page.url());
//     console.log("time out");
//     lastpage = page.url();
//     // if (!lastpage) {
//     //   // page.evaluate(() => {
//     //   //   document.querySelector('[aria-label="Previous"]').click();
//     //   // });
//     //   _goPrevPage(page);
//     //   lastpage = page.url();
//     //   return;
//     // }
//     // lastpage= page.url();
//     if (lastpage === page.url()) {
//       // if (tryed) {
//       //   page.evaluate(() => {
//       //     location.reload();
//       //   });
//       //   console.log("page reload");
//       //   tryed = false;
//       // }
//       // let pageNumbers = page.url().split("/").pop();
//       // // lastpage = 'https://ponisha.ir/search/projects/currency-IRR/sort-newest/page/' +  pageNumbers ===
//       // lastpage =
//       //   "https://ponisha.ir/search/projects/skill-%D9%88%D8%B1%D8%AF%D9%BE%D8%B1%D8%B3/status-open/page/" +
//       //   pageNumbers;

//       // _goNextPage(page);
//       // // page.evaluate(() => {
//       // //   document.querySelector('[aria-label="Next"]').click();
//       // // });
//       // tryed = true;
//       console.log('freezed');
//     } else {
//       console.log("ignored");
//       lastpage = page.url();
//     }
//   }, 10000);
//   return interval
// };

const _goNextPage = async (page) => {
  await page.evaluate(() => {
    document.querySelector('[aria-label="Next"]').click();
  });
};

const _goPrevPage = async (page) => {
  await page.evaluate(() => {
    document.querySelector('[aria-label="Previous"]').click();
  });
};

const _generateUrl = async ({ skill, sortType, status } = {}) => {
  const baseUrl = "https://ponisha.ir/search/projects";
  const urls = [];
  if (skill.includes("%")) skill = decodeURI(skill);
  const allowedSkills = await config.get('skills.feilds', []);
  console.log(allowedSkills);
  if (!allowedSkills.includes(`skill-${skill}`)) {
    throw new Error("skill not allowed");
  }
  urls.push(skill ? `skill-${skill}` : null);
  urls.push("currency-IRR");
  urls.push(status ? `status-${status}` : null);
  urls.push(sortType ? `sort-${sortType}` : null);

  return `${baseUrl}/${urls.filter((url) => url).join("/")}`;
};

const getProjects = async ({
  puppeteerOptions,
  skill,
  sortType = "sort-newest",
  limit,
  status = "status-open",
} = {}) =>
  new Promise(async (resolve, reject) => {
    const browser = puppeteerOptions
      ? await _loadBrowser(puppeteerOptions)
      : await _loadBrowser();
    let endPage = 0;
    let currentPage = 0;
    const page = await _loadPage(
      browser,
      "https://ponisha.ir/search/projects/skill-%D9%88%D8%B1%D8%AF%D9%BE%D8%B1%D8%B3/status-open/page/2",
      {
        timeout: 20000,
        waitUntil: ["load", "domcontentloaded", "networkidle0", "networkidle2"],
      }
    );
    // wait for page loading complete
    await _goPrevPage(page);

    // prevent freezing
    //  const preventFreezeInterval =  _preventFreeze(page);

    let state = [];

    //  ignore unuseful {css,image,font,media} in requests
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (
        [
          "image",
          "stylesheet",
          "font",
          "media",
          "script",
          "xhr",
          "fetch",
          "websocket",
        ].indexOf(request.resourceType()) === -1
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });

    page.on("response", async (response) => {
      // console.log(response.url());
      if (response.url().includes("https://ponisha.ir/search/projects/")) {
        // if is json
        if (response.headers()["content-type"].includes("application/json")) {
          let data = await response.json();
          endPage = data?.items?.last_page;
          currentPage = data?.items?.current_page;
          console.log(`page ${currentPage} of ${endPage} load and parsed`);
          if (!endPage) {
            throw new Error("end page not found");
          }
          // console.log(await response.json());
          state = state.concat(data.items.data);
          if (limit && state.length >= limit) {
            console.log("limit reached");
            await browser.close();
            return resolve(state.slice(0, limit));
          }

          console.log(`total collected: ${state.length}`);
          if (endPage === currentPage) {
            console.log("end page reached");
            // clearInterval(preventFreezeInterval)
            await page.close();
            await browser.close();
            return resolve(state);
            // page.close();
            // browser.close();
            // return state;
          }
          // let pageName = response.url().split('/').pop();
          await _goNextPage(page);
        }
      }
    });
  });

export { getProjects };
