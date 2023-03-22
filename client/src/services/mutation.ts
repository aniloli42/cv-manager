import axios from "axios";

export async function filerCVMutation(data: { tags: string[] }) {
  return await axios.post(import.meta.env.VITE_SERVER_URL, data);
}
