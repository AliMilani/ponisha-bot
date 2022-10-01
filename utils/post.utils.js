export const createPost = ({
  title,
  description,
  amountMin,
  amountMax,
  skills = [],
  id,
  bidsNumber,
}) => `
✅ عنوان : ${title}
✅ توضیحات : ${description}.\n
✅ مهارت ها : ${skills.map((skill) => skill.title).join(" | ")}\n
✅ پایین ترین قیمت : ${amountMin / 10} تومان
✅ بالا ترین قیمت : ${amountMax / 10} تومان
✅ تعداد پیشنهاد : ${bidsNumber}\n
✅ لینک : https://pnsh.co/p${id}
    `;
