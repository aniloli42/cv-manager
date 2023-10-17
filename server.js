import { PdfReader } from "pdfreader";
let text;

new PdfReader().parseFileItems("./pdf.pdf", (err, item) => {
  if (err) console.error("error:", err);
  else if (!item) console.log(text);
  else if (item.text) {
    text += item.text;
  }
});
