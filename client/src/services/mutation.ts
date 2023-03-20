import axios from "axios";

export async function filerCVQuery(data: { filePath: string; tags: string[] }) {
  return await axios.post("http://localhost:5000/cv", data);
}
