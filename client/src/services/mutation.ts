import axios from "axios";

export async function filerCVMutation(data: { tags: string[] }) {
  const serverURL = import.meta.env.VITE_SERVER_URL;

  if (serverURL == undefined || serverURL === "")
    throw new Error("Server URL not found!");

  const SERVER_URL = new URL(serverURL)

  const res = await axios.post(SERVER_URL as unknown as string, data);
  return res;
}
