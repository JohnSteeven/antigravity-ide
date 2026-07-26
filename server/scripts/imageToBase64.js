const fs = require("fs");
const path = require("path");

const notebookImgPath = path.join(__dirname, "../../src/components/notebook_coffee_sketch.jpg");
const notebookData = fs.readFileSync(notebookImgPath);
const notebookBase64 = notebookData.toString("base64");

const leavesImgPath = "C:\\Users\\NOBLE JOHN STEEVEN\\.gemini\\antigravity-ide\\brain\\5df1742c-e13a-4b83-81e2-19bd41d28773\\leaves_branch_sketch_1785041238783.png";
const leavesData = fs.readFileSync(leavesImgPath);
const leavesBase64 = leavesData.toString("base64");

const jsContent = `export const notebookSketchBase64 = "data:image/jpeg;base64,${notebookBase64}";
export const leavesSketchBase64 = "data:image/png;base64,${leavesBase64}";
`;

fs.writeFileSync(path.join(__dirname, "../../src/components/sketchData.js"), jsContent);
console.log("Converted both images to base64 successfully!");
