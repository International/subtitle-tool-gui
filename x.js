require("babel-polyfill");

async function potato() {
  await setTimeout(() => console.log("potato"), 300);
  return 200;
}

potato()
