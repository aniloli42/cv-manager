import axios from "axios";

export async function filerCVQuery(data: { tags: string[] }) {
  return await axios.post("http://localhost:5000/cv", data);
}
