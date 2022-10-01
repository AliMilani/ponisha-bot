import { getProjects } from "./ponisha.js";
import { createPost } from "./utils/post.utils.js";
import fs from "fs";

(async () => {
  const state = await getProjects({
    skill: 'skill-وردپرس',
    limit: 40,
    sortType: 'sort-newest',
  });

  const posts = state.map((project) => {
    const {
      title,
      description,
      amount_min,
      amount_max,
      skills,
      id,
      bids_number,
    } = project;
    return createPost({
      title,
      amountMax: amount_max,
      amountMin: amount_min,
      bidsNumber: bids_number,
      description,
      id,
      skills,
    });
  });
  fs.writeFileSync("result.json", JSON.stringify({posts}));
  // console.log(fs.writeFileSync('the file .json',JSON.stringify(await getState())));
})();
