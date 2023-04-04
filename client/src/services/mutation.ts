import axios from "axios";

export async function filerCVMutation(data: { tags: string[] }) {
  const serverURL = import.meta.env.VITE_SERVER_URL;

  if (serverURL == undefined || serverURL === "")
    throw new Error("Server URL not found!");

  const res = await axios.post(serverURL, data);

  return res;
}
