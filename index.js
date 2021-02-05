const puppeteer = require("puppeteer-extra");
const RecaptchaPlugin = require("puppeteer-extra-plugin-recaptcha");

puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: "2captcha",
      token: "TOKEN",
    },
    visualFeedback: false,
  })
);

console.log("Iniciando navegador...");

const runBot = () => {
  puppeteer
    .launch({
      headless: false,
      devtools: false,
      args: [`--window-size=800,800`],
    })
    .then(async (browser) => {
      try {
        const URL = "https://mivacuna.salud.gob.mx/index.php";
        const CURP = ".....................";

        const page = await browser.newPage();

        console.log("Visitando el sitio...");
        await page.goto(URL);

        console.log("Escribiendo CURP...");
        await page.type("#curp", CURP, { delay: 100 });

        console.log("Resolviendo Recaptcha...");
        const { solutions } = await page.solveRecaptchas();

        console.log(`Resuelto en ${solutions[0].duration}s`);
        await page.$eval(
          "#g-recaptcha-response",
          (el, value) => {
            el.value = value;
          },
          solutions[0].text
        );

        console.log("validando...");
        await page.click("#btn-confirma");

        await page.waitForTimeout(7 * 1000);

        const cargando = await page.$eval("#consulta_curp", (el) => {
          return el.innerText.includes("CONSULTANDO");
        });

        if (cargando) {
          console.log("Cargando...");
          await page.waitForTimeout(7 * 1000);
        }

        console.log("Validando errores...");
        const error1 = await page.$eval(
          "#resultado + #resultado",
          (el) => el.style.display === ""
        );

        const error2 = await page.$eval("#consulta_curp", (el) => {
          return el.innerText.includes("Sin");
        });

        if (error1 || error2) {
          throw new Error("Mal :(");
        }
      } catch (error) {
        console.log(error);
        await browser.close();
        runBot();
      }
    })
    .catch((error) => {
      console.log(error);
    });
};

runBot();
