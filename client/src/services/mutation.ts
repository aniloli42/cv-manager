import axios from "axios";

export async function filerCVQuery(data: { tags: string[] }) {
  try {
    const res = await axios.post("http://localhost:5000/cv", data);

    return res.data;
  } catch (err) {
    return err;
  }
}
